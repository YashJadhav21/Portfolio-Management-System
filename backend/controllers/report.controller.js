const Investor = require('../models/Investor.model');
const FixedDeposit = require('../models/FixedDeposit.model');
const MutualFund = require('../models/MutualFund.model');
const Share = require('../models/Share.model');
const AMC = require('../models/AMC.model');

// Investor Portfolio Report
const investorPortfolio = async (req, res) => {
  try {
    const investors = await Investor.find({ status: 'Active' }).populate('groupId', 'name').lean();
    const result = [];

    for (const inv of investors) {
      const fdAgg = await FixedDeposit.aggregate([
        { $match: { investorId: inv._id, status: 'Active' } },
        { $group: { _id: null, total: { $sum: '$amount' }, maturity: { $sum: '$maturityAmount' } } },
      ]);

      const mfAgg = await MutualFund.aggregate([
        { $match: { investorId: inv._id } },
        { $group: {
          _id: null,
          purchased: { $sum: { $cond: [{ $eq: ['$type', 'Purchase'] }, '$amount', 0] } },
          redeemed: { $sum: { $cond: [{ $eq: ['$type', 'Redemption'] }, '$amount', 0] } },
        }},
      ]);

      const shareAgg = await Share.aggregate([
        { $match: { investorId: inv._id } },
        { $group: {
          _id: null,
          bought: { $sum: { $cond: [{ $eq: ['$type', 'Buy'] }, '$totalAmount', 0] } },
          sold: { $sum: { $cond: [{ $eq: ['$type', 'Sell'] }, '$totalAmount', 0] } },
        }},
      ]);

      const fdTotal = fdAgg[0]?.total || 0;
      const mfNet = (mfAgg[0]?.purchased || 0) - (mfAgg[0]?.redeemed || 0);
      const sharesNet = (shareAgg[0]?.bought || 0) - (shareAgg[0]?.sold || 0);

      result.push({
        name: inv.name, email: inv.email, mobile: inv.mobile, pan: inv.pan,
        group: inv.groupId?.name || '—',
        fdInvested: fdTotal, fdMaturity: fdAgg[0]?.maturity || 0,
        mfInvested: mfNet, sharesInvested: sharesNet,
        totalPortfolio: fdTotal + mfNet + sharesNet,
      });
    }

    res.json({ success: true, data: result });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// AMC-wise Report
const amcWise = async (req, res) => {
  try {
    const data = await MutualFund.aggregate([
      {
        $group: {
          _id: '$amcId',
          totalPurchased: { $sum: { $cond: [{ $eq: ['$type', 'Purchase'] }, '$amount', 0] } },
          totalRedeemed: { $sum: { $cond: [{ $eq: ['$type', 'Redemption'] }, '$amount', 0] } },
          totalUnits: { $sum: { $cond: [{ $eq: ['$type', 'Purchase'] }, '$units', 0] } },
          txCount: { $sum: 1 },
        },
      },
      { $lookup: { from: 'amcs', localField: '_id', foreignField: '_id', as: 'amc' } },
      { $unwind: { path: '$amc', preserveNullAndEmptyArrays: true } },
      { $addFields: { netInvested: { $subtract: ['$totalPurchased', '$totalRedeemed'] } } },
      { $sort: { totalPurchased: -1 } },
    ]);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// FD Maturity Report
const fdMaturity = async (req, res) => {
  try {
    const { from, to, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (from || to) {
      filter.maturityDate = {};
      if (from) filter.maturityDate.$gte = new Date(from);
      if (to) filter.maturityDate.$lte = new Date(to);
    }

    const data = await FixedDeposit.find(filter)
      .populate('investorId', 'name email pan')
      .sort({ maturityDate: 1 })
      .lean();

    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// MF Holdings Report
const mfHoldings = async (req, res) => {
  try {
    const data = await MutualFund.aggregate([
      { $group: {
        _id: { investorId: '$investorId', schemeId: '$schemeId' },
        totalPurchasedUnits: { $sum: { $cond: [{ $eq: ['$type', 'Purchase'] }, '$units', 0] } },
        totalRedeemedUnits: { $sum: { $cond: [{ $eq: ['$type', 'Redemption'] }, '$units', 0] } },
        totalInvested: { $sum: { $cond: [{ $eq: ['$type', 'Purchase'] }, '$amount', 0] } },
        totalRedeemed: { $sum: { $cond: [{ $eq: ['$type', 'Redemption'] }, '$amount', 0] } },
      }},
      { $addFields: { netUnits: { $subtract: ['$totalPurchasedUnits', '$totalRedeemedUnits'] } } },
      { $match: { netUnits: { $gt: 0 } } },
      { $lookup: { from: 'investors', localField: '_id.investorId', foreignField: '_id', as: 'investor' } },
      { $lookup: { from: 'schemes', localField: '_id.schemeId', foreignField: '_id', as: 'scheme' } },
      { $unwind: '$investor' }, { $unwind: '$scheme' },
      { $lookup: { from: 'amcs', localField: 'scheme.amcId', foreignField: '_id', as: 'amc' } },
      { $unwind: { path: '$amc', preserveNullAndEmptyArrays: true } },
      { $project: {
        investor: { name: 1, pan: 1 },
        scheme: { name: 1, nav: 1 },
        amc: { name: 1 },
        netUnits: 1, totalInvested: 1,
        currentValue: { $multiply: ['$netUnits', '$scheme.nav'] },
      }},
    ]);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Profit & Loss Report
const profitLoss = async (req, res) => {
  try {
    const mfPnL = await MutualFund.aggregate([
      { $group: {
        _id: '$investorId',
        totalPurchased: { $sum: { $cond: [{ $eq: ['$type', 'Purchase'] }, '$amount', 0] } },
        totalRedeemed: { $sum: { $cond: [{ $eq: ['$type', 'Redemption'] }, '$amount', 0] } },
      }},
      { $lookup: { from: 'investors', localField: '_id', foreignField: '_id', as: 'investor' } },
      { $unwind: '$investor' },
      { $addFields: { mfPnL: { $subtract: ['$totalRedeemed', '$totalPurchased'] } } },
    ]);

    const sharePnL = await Share.aggregate([
      { $group: {
        _id: '$investorId',
        totalBuy: { $sum: { $cond: [{ $eq: ['$type', 'Buy'] }, '$totalAmount', 0] } },
        totalSell: { $sum: { $cond: [{ $eq: ['$type', 'Sell'] }, '$totalAmount', 0] } },
      }},
      { $lookup: { from: 'investors', localField: '_id', foreignField: '_id', as: 'investor' } },
      { $unwind: '$investor' },
      { $addFields: { sharePnL: { $subtract: ['$totalSell', '$totalBuy'] } } },
    ]);

    // Merge by investor
    const map = {};
    mfPnL.forEach((r) => {
      map[r._id] = { investor: r.investor.name, mfPurchased: r.totalPurchased, mfRedeemed: r.totalRedeemed, mfPnL: r.mfPnL, sharesPnL: 0 };
    });
    sharePnL.forEach((r) => {
      if (map[r._id]) map[r._id].sharesPnL = r.sharePnL;
      else map[r._id] = { investor: r.investor.name, mfPurchased: 0, mfRedeemed: 0, mfPnL: 0, sharesPnL: r.sharePnL };
    });

    const result = Object.values(map).map((r) => ({
      ...r, totalPnL: (r.mfPnL || 0) + (r.sharesPnL || 0),
    }));

    res.json({ success: true, data: result });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Asset Allocation Report
const assetAllocation = async (req, res) => {
  try {
    const [fdAgg, mfAgg, shareAgg] = await Promise.all([
      FixedDeposit.aggregate([{ $match: { status: 'Active' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      MutualFund.aggregate([{ $group: { _id: null, p: { $sum: { $cond: [{ $eq: ['$type', 'Purchase'] }, '$amount', 0] } }, r: { $sum: { $cond: [{ $eq: ['$type', 'Redemption'] }, '$amount', 0] } } } }]),
      Share.aggregate([{ $group: { _id: null, b: { $sum: { $cond: [{ $eq: ['$type', 'Buy'] }, '$totalAmount', 0] } }, s: { $sum: { $cond: [{ $eq: ['$type', 'Sell'] }, '$totalAmount', 0] } } } }]),
    ]);
    const fd = fdAgg[0]?.total || 0;
    const mf = (mfAgg[0]?.p || 0) - (mfAgg[0]?.r || 0);
    const sh = (shareAgg[0]?.b || 0) - (shareAgg[0]?.s || 0);
    const total = fd + mf + sh;
    res.json({
      success: true, data: [
        { asset: 'Fixed Deposits', amount: fd, percentage: total ? ((fd / total) * 100).toFixed(1) : 0 },
        { asset: 'Mutual Funds', amount: mf, percentage: total ? ((mf / total) * 100).toFixed(1) : 0 },
        { asset: 'Shares', amount: sh, percentage: total ? ((sh / total) * 100).toFixed(1) : 0 },
      ],
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Share Holdings Report
const shareHoldings = async (req, res) => {
  try {
    const data = await Share.aggregate([
      {
        $group: {
          _id: { investorId: '$investorId', companyId: '$companyId', exchange: '$bseNseFlag' },
          netShares: {
            $sum: {
              $cond: [{ $eq: ['$type', 'Purchase'] }, '$noOfShares',
                { $multiply: ['$noOfShares', -1] }],
            },
          },
          totalInvested: {
            $sum: { $cond: [{ $eq: ['$type', 'Purchase'] }, '$amount', 0] },
          },
          avgPrice: { $avg: '$price' },
          isin: { $first: '$isin' },
        },
      },
      { $match: { netShares: { $gt: 0 } } },
      { $lookup: { from: 'investors', localField: '_id.investorId', foreignField: '_id', as: 'investor' } },
      { $lookup: { from: 'companies', localField: '_id.companyId', foreignField: '_id', as: 'company' } },
      { $unwind: { path: '$investor', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$company', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          investor: { _id: '$investor._id', name: '$investor.name' },
          company: { _id: '$company._id', name: '$company.name' },
          exchange: '$_id.exchange',
          isin: 1,
          netShares: 1,
          totalInvested: 1,
          // Approximate current value = netShares * avgPrice (no live price feed)
          currentValue: { $multiply: ['$netShares', '$avgPrice'] },
        },
      },
      { $sort: { 'investor.name': 1, 'company.name': 1 } },
    ]);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

module.exports = { investorPortfolio, amcWise, fdMaturity, mfHoldings, shareHoldings, profitLoss, assetAllocation };
