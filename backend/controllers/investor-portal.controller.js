const Investor = require('../models/Investor.model');
const FixedDeposit = require('../models/FixedDeposit.model');
const MutualFund = require('../models/MutualFund.model');
const Share = require('../models/Share.model');
const User = require('../models/User.model');
const bcrypt = require('bcryptjs');

// Helper: calculate portfolio totals for an investor
async function getInvestorTotals(investorId) {
  const mongoose = require('mongoose');
  const id = typeof investorId === 'string' ? new mongoose.Types.ObjectId(investorId) : investorId;

  const [fdAgg, mfAgg, shareAgg] = await Promise.all([
    FixedDeposit.aggregate([
      { $match: { investorId: id, status: 'Active' } },
      { $group: { _id: null, total: { $sum: '$amount' }, maturity: { $sum: '$maturityAmount' } } },
    ]),
    MutualFund.aggregate([
      { $match: { investorId: id } },
      {
        $group: {
          _id: null,
          purchased: { $sum: { $cond: [{ $eq: ['$type', 'Purchase'] }, '$amount', 0] } },
          redeemed: { $sum: { $cond: [{ $eq: ['$type', 'Redemption'] }, '$amount', 0] } },
          purchasedUnits: { $sum: { $cond: [{ $eq: ['$type', 'Purchase'] }, '$units', 0] } },
          redeemedUnits: { $sum: { $cond: [{ $eq: ['$type', 'Redemption'] }, '$units', 0] } },
        },
      },
    ]),
    Share.aggregate([
      { $match: { investorId: id } },
      {
        $group: {
          _id: null,
          buy: { $sum: { $cond: [{ $eq: ['$type', 'Purchase'] }, '$amount', 0] } },
          sell: { $sum: { $cond: [{ $eq: ['$type', 'Sales'] }, '$amount', 0] } },
        },
      },
    ]),
  ]);

  const fdInvested = fdAgg[0]?.total || 0;
  const fdMaturity = fdAgg[0]?.maturity || 0;
  const mfNet = (mfAgg[0]?.purchased || 0) - (mfAgg[0]?.redeemed || 0);
  const sharesNet = (shareAgg[0]?.buy || 0) - (shareAgg[0]?.sell || 0);

  return {
    fixedIncome: { invested: fdInvested, marketValue: fdMaturity },
    mutualFunds: { invested: mfNet, marketValue: mfNet },
    shares: { invested: sharesNet, marketValue: sharesNet },
    insurance: { invested: 0, marketValue: 0 },
    totalInvested: fdInvested + mfNet + sharesNet,
    totalMarketValue: fdMaturity + mfNet + sharesNet,
  };
}

// @desc  Get family group tree with amounts
// @route GET /api/investor-portal/group-tree
const getGroupTree = async (req, res) => {
  try {
    const investorId = req.user.investorId;
    if (!investorId) {
      return res.status(400).json({ success: false, message: 'No investor linked to this account' });
    }

    const investor = await Investor.findById(investorId).populate('groupId').lean();
    if (!investor) {
      return res.status(404).json({ success: false, message: 'Investor not found' });
    }

    // Get all group members (or just this investor if no group)
    let groupMembers = [investor];
    let groupInfo = null;
    if (investor.groupId) {
      groupInfo = investor.groupId;
      groupMembers = await Investor.find({ groupId: investor.groupId._id, status: 'Active' }).lean();
    }

    // Get portfolio totals for each member
    const membersWithPortfolio = await Promise.all(
      groupMembers.map(async (member) => {
        const totals = await getInvestorTotals(member._id);
        return {
          _id: member._id,
          name: member.name,
          pan: member.pan,
          isCurrentUser: member._id.toString() === investorId.toString(),
          ...totals,
        };
      })
    );

    const totalInvested = membersWithPortfolio.reduce((s, m) => s + m.totalInvested, 0);
    const totalMarketValue = membersWithPortfolio.reduce((s, m) => s + m.totalMarketValue, 0);

    res.json({
      success: true,
      data: {
        group: groupInfo
          ? { _id: groupInfo._id, name: groupInfo.name }
          : { _id: null, name: `${investor.name} (Individual)` },
        members: membersWithPortfolio,
        totals: { invested: totalInvested, marketValue: totalMarketValue },
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// @desc  Get investor's own dashboard stats
// @route GET /api/investor-portal/dashboard
const getMyDashboard = async (req, res) => {
  try {
    const investorId = req.user.investorId;
    if (!investorId) {
      return res.status(400).json({ success: false, message: 'No investor linked to this account' });
    }

    const totals = await getInvestorTotals(investorId);

    // Recent activity for this investor
    const recentFD = await FixedDeposit.find({ investorId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentMF = await MutualFund.find({ investorId })
      .populate('schemeId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      data: {
        stats: totals,
        recentActivity: {
          fd: recentFD.map((fd) => ({
            type: 'Fixed Income',
            bank: fd.bankName,
            amount: fd.amount,
            date: fd.effectiveDate,
            status: fd.status,
          })),
          mf: recentMF.map((mf) => ({
            type: `MF ${mf.type}`,
            scheme: mf.schemeId?.name || 'N/A',
            amount: mf.amount,
            date: mf.transactionDate,
          })),
        },
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ─── FIXED INCOME CRUD (scoped to this investor) ──────────────────────────────

const getMyFD = async (req, res) => {
  try {
    const investorId = req.user.investorId;
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const filter = { investorId };
    if (search) filter.bankName = { $regex: search, $options: 'i' };

    const [data, total] = await Promise.all([
      FixedDeposit.find(filter).sort({ effectiveDate: -1 }).skip(skip).limit(Number(limit)).lean(),
      FixedDeposit.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const createMyFD = async (req, res) => {
  try {
    const investorId = req.user.investorId;
    const { amount, interestRate, tenureMonths } = req.body;

    // Calculate maturity amount
    const years = tenureMonths / 12;
    const maturityAmount = parseFloat((amount * Math.pow(1 + interestRate / 100, years)).toFixed(2));
    const interestEarned = parseFloat((maturityAmount - amount).toFixed(2));

    const fd = new FixedDeposit({
      ...req.body,
      investorId,
      maturityAmount,
      interestEarned,
    });
    await fd.save();
    res.status(201).json({ success: true, data: fd });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

const updateMyFD = async (req, res) => {
  try {
    const investorId = req.user.investorId;
    const { amount, interestRate, tenureMonths } = req.body;

    let extra = {};
    if (amount && interestRate && tenureMonths) {
      const years = tenureMonths / 12;
      extra.maturityAmount = parseFloat((amount * Math.pow(1 + interestRate / 100, years)).toFixed(2));
      extra.interestEarned = parseFloat((extra.maturityAmount - amount).toFixed(2));
    }

    const fd = await FixedDeposit.findOneAndUpdate(
      { _id: req.params.id, investorId },
      { ...req.body, ...extra },
      { new: true, runValidators: true }
    );
    if (!fd) return res.status(404).json({ success: false, message: 'Not found or not authorised' });
    res.json({ success: true, data: fd });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

const deleteMyFD = async (req, res) => {
  try {
    const investorId = req.user.investorId;
    const fd = await FixedDeposit.findOneAndDelete({ _id: req.params.id, investorId });
    if (!fd) return res.status(404).json({ success: false, message: 'Not found or not authorised' });
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ─── MUTUAL FUNDS CRUD ────────────────────────────────────────────────────────

const getMyMF = async (req, res) => {
  try {
    const investorId = req.user.investorId;
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      MutualFund.find({ investorId })
        .populate('amcId', 'name')
        .populate('schemeId', 'name nav')
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      MutualFund.countDocuments({ investorId }),
    ]);

    res.json({
      success: true,
      data,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const createMyMF = async (req, res) => {
  try {
    const investorId = req.user.investorId;
    const mf = new MutualFund({ ...req.body, investorId });
    await mf.save();
    res.status(201).json({ success: true, data: mf });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

const updateMyMF = async (req, res) => {
  try {
    const investorId = req.user.investorId;
    const mf = await MutualFund.findOneAndUpdate(
      { _id: req.params.id, investorId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!mf) return res.status(404).json({ success: false, message: 'Not found or not authorised' });
    res.json({ success: true, data: mf });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

const deleteMyMF = async (req, res) => {
  try {
    const investorId = req.user.investorId;
    const mf = await MutualFund.findOneAndDelete({ _id: req.params.id, investorId });
    if (!mf) return res.status(404).json({ success: false, message: 'Not found or not authorised' });
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// MF Holdings for this investor
const getMyMFHoldings = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const investorId = req.user.investorId;
    const id = new mongoose.Types.ObjectId(investorId);

    const data = await MutualFund.aggregate([
      { $match: { investorId: id } },
      {
        $group: {
          _id: '$schemeId',
          totalPurchasedUnits: { $sum: { $cond: [{ $eq: ['$type', 'Purchase'] }, '$units', 0] } },
          totalRedeemedUnits: { $sum: { $cond: [{ $eq: ['$type', 'Redemption'] }, '$units', 0] } },
          totalInvested: { $sum: { $cond: [{ $eq: ['$type', 'Purchase'] }, '$amount', 0] } },
          totalRedeemed: { $sum: { $cond: [{ $eq: ['$type', 'Redemption'] }, '$amount', 0] } },
        },
      },
      { $addFields: { netUnits: { $subtract: ['$totalPurchasedUnits', '$totalRedeemedUnits'] } } },
      { $match: { netUnits: { $gt: 0 } } },
      { $lookup: { from: 'schemes', localField: '_id', foreignField: '_id', as: 'scheme' } },
      { $unwind: '$scheme' },
      { $lookup: { from: 'amcs', localField: 'scheme.amcId', foreignField: '_id', as: 'amc' } },
      { $unwind: { path: '$amc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          scheme: { name: 1, nav: 1 },
          amc: { name: 1 },
          netUnits: 1,
          totalInvested: 1,
          currentValue: { $multiply: ['$netUnits', '$scheme.nav'] },
        },
      },
    ]);

    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ─── SHARES CRUD ──────────────────────────────────────────────────────────────

const getMyShares = async (req, res) => {
  try {
    const investorId = req.user.investorId;
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Share.find({ investorId })
        .populate('companyId', 'name symbol sector')
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Share.countDocuments({ investorId }),
    ]);

    res.json({
      success: true,
      data,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const createMyShare = async (req, res) => {
  try {
    const investorId = req.user.investorId;
    const share = new Share({ ...req.body, investorId });
    await share.save();
    res.status(201).json({ success: true, data: share });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

const updateMyShare = async (req, res) => {
  try {
    const investorId = req.user.investorId;
    const share = await Share.findOneAndUpdate(
      { _id: req.params.id, investorId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!share) return res.status(404).json({ success: false, message: 'Not found or not authorised' });
    res.json({ success: true, data: share });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

const deleteMyShare = async (req, res) => {
  try {
    const investorId = req.user.investorId;
    const share = await Share.findOneAndDelete({ _id: req.params.id, investorId });
    if (!share) return res.status(404).json({ success: false, message: 'Not found or not authorised' });
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const getMyShareHoldings = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const investorId = req.user.investorId;
    const id = new mongoose.Types.ObjectId(investorId);

    const data = await Share.aggregate([
      { $match: { investorId: id } },
      {
        $group: {
          _id: { companyId: '$companyId', exchange: '$bseNseFlag' },
          totalBuyQty: { $sum: { $cond: [{ $eq: ['$type', 'Purchase'] }, '$noOfShares', 0] } },
          totalSellQty: { $sum: { $cond: [{ $eq: ['$type', 'Sales'] }, '$noOfShares', 0] } },
          totalBuyAmount: { $sum: { $cond: [{ $eq: ['$type', 'Purchase'] }, '$amount', 0] } },
          totalSellAmount: { $sum: { $cond: [{ $eq: ['$type', 'Sales'] }, '$amount', 0] } },
        },
      },
      { $addFields: { netQuantity: { $subtract: ['$totalBuyQty', '$totalSellQty'] } } },
      { $match: { netQuantity: { $gt: 0 } } },
      { $lookup: { from: 'companies', localField: '_id.companyId', foreignField: '_id', as: 'company' } },
      { $unwind: { path: '$company', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          company: { name: 1, symbol: '$code', sector: 1 },
          exchange: '$_id.exchange',
          netQuantity: 1,
          totalBuyAmount: 1,
          realizedPnL: { $subtract: ['$totalSellAmount', '$totalBuyAmount'] },
          avgBuyPrice: {
            $cond: [
              { $gt: ['$totalBuyQty', 0] },
              { $divide: ['$totalBuyAmount', '$totalBuyQty'] },
              0,
            ],
          },
        },
      },
    ]);

    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ─── ADMIN: Create login for investor ─────────────────────────────────────────

const createInvestorLogin = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const investor = await Investor.findById(id);
    if (!investor) {
      return res.status(404).json({ success: false, message: 'Investor not found' });
    }

    // Check if a user already linked to this investor
    const existing = await User.findOne({ investorId: id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Login already exists for this investor' });
    }

    // Check username not taken
    const usernameTaken = await User.findOne({ username });
    if (usernameTaken) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    const user = new User({
      username,
      email: investor.email,
      password,
      role: 'investor',
      investorId: id,
    });
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Investor login created successfully',
      data: { username: user.username, email: user.email, role: user.role },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Get linked user for an investor (admin use)
const getInvestorLoginStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ investorId: id }).select('username email isActive createdAt');
    res.json({ success: true, data: user || null });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ─── INVESTOR REPORTS (scoped) ────────────────────────────────────────────────

const getMyFDMaturity = async (req, res) => {
  try {
    const investorId = req.user.investorId;
    const { status, from, to } = req.query;
    const filter = { investorId };
    if (status) filter.status = status;
    if (from || to) {
      filter.maturityDate = {};
      if (from) filter.maturityDate.$gte = new Date(from);
      if (to) filter.maturityDate.$lte = new Date(to);
    }
    const data = await FixedDeposit.find(filter).sort({ maturityDate: 1 }).lean();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const getMyProfitLoss = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const investorId = req.user.investorId;
    const id = new mongoose.Types.ObjectId(investorId);

    const [mfAgg, shareAgg] = await Promise.all([
      MutualFund.aggregate([
        { $match: { investorId: id } },
        {
          $group: {
            _id: null,
            mfPurchased: { $sum: { $cond: [{ $eq: ['$type', 'Purchase'] }, '$amount', 0] } },
            mfRedeemed: { $sum: { $cond: [{ $eq: ['$type', 'Redemption'] }, '$amount', 0] } },
          },
        },
      ]),
      Share.aggregate([
        { $match: { investorId: id } },
        {
          $group: {
            _id: null,
            shareBuy: { $sum: { $cond: [{ $eq: ['$type', 'Purchase'] }, '$amount', 0] } },
            shareSell: { $sum: { $cond: [{ $eq: ['$type', 'Sales'] }, '$amount', 0] } },
          },
        },
      ]),
    ]);

    const mfPurchased = mfAgg[0]?.mfPurchased || 0;
    const mfRedeemed = mfAgg[0]?.mfRedeemed || 0;
    const mfPnL = mfRedeemed - mfPurchased;
    const sharesPnL = (shareAgg[0]?.shareSell || 0) - (shareAgg[0]?.shareBuy || 0);

    res.json({
      success: true,
      data: { mfPurchased, mfRedeemed, mfPnL, sharesPnL, totalPnL: mfPnL + sharesPnL },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = {
  getGroupTree,
  getMyDashboard,
  // FD
  getMyFD, createMyFD, updateMyFD, deleteMyFD,
  // MF
  getMyMF, createMyMF, updateMyMF, deleteMyMF, getMyMFHoldings,
  // Shares
  getMyShares, createMyShare, updateMyShare, deleteMyShare, getMyShareHoldings,
  // Admin
  createInvestorLogin, getInvestorLoginStatus,
  // Reports
  getMyFDMaturity, getMyProfitLoss,
};
