const Investor = require('../models/Investor.model');
const FixedDeposit = require('../models/FixedDeposit.model');
const MutualFund = require('../models/MutualFund.model');
const Share = require('../models/Share.model');
const AMC = require('../models/AMC.model');
const Scheme = require('../models/Scheme.model');
const Group = require('../models/Group.model');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    // Total investors
    const totalInvestors = await Investor.countDocuments({ status: 'Active' });

    // Total FD value
    const fdAgg = await FixedDeposit.aggregate([
      { $match: { status: 'Active' } },
      { $group: { _id: null, totalFD: { $sum: '$amount' }, totalMaturity: { $sum: '$maturityAmount' } } },
    ]);
    const totalFD = fdAgg[0]?.totalFD || 0;

    // Total MF value (invested)
    const mfAgg = await MutualFund.aggregate([
      {
        $group: {
          _id: null,
          totalPurchased: { $sum: { $cond: [{ $eq: ['$type', 'Purchase'] }, '$amount', 0] } },
          totalRedeemed: { $sum: { $cond: [{ $eq: ['$type', 'Redemption'] }, '$amount', 0] } },
        },
      },
    ]);
    const totalMFInvested = (mfAgg[0]?.totalPurchased || 0) - (mfAgg[0]?.totalRedeemed || 0);

    // Total Shares value
    const shareAgg = await Share.aggregate([
      {
        $group: {
          _id: null,
          totalBuy: { $sum: { $cond: [{ $eq: ['$type', 'Buy'] }, '$totalAmount', 0] } },
          totalSell: { $sum: { $cond: [{ $eq: ['$type', 'Sell'] }, '$totalAmount', 0] } },
        },
      },
    ]);
    const totalSharesInvested = (shareAgg[0]?.totalBuy || 0) - (shareAgg[0]?.totalSell || 0);

    // Total portfolio
    const totalPortfolio = totalFD + totalMFInvested + totalSharesInvested;

    // Asset allocation
    const assetAllocation = [
      { name: 'Fixed Deposits', value: parseFloat(totalFD.toFixed(2)), color: '#3B82F6' },
      { name: 'Mutual Funds', value: parseFloat(totalMFInvested.toFixed(2)), color: '#8B5CF6' },
      { name: 'Shares', value: parseFloat(totalSharesInvested.toFixed(2)), color: '#10B981' },
    ];

    // Monthly investment trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyMF = await MutualFund.aggregate([
      { $match: { transactionDate: { $gte: sixMonthsAgo }, type: 'Purchase' } },
      {
        $group: {
          _id: { year: { $year: '$transactionDate' }, month: { $month: '$transactionDate' } },
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthlyFD = await FixedDeposit.aggregate([
      { $match: { effectiveDate: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$effectiveDate' }, month: { $month: '$effectiveDate' } },
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // AMC distribution
    const amcDistribution = await MutualFund.aggregate([
      { $match: { type: 'Purchase' } },
      { $group: { _id: '$amcId', value: { $sum: '$amount' } } },
      {
        $lookup: {
          from: 'amcs',
          localField: '_id',
          foreignField: '_id',
          as: 'amc',
        },
      },
      { $unwind: { path: '$amc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ['$amc.name', 'Unknown'] },
          value: 1,
        },
      },
      { $sort: { value: -1 } },
      { $limit: 6 },
    ]);

    // Recent transactions (last 5 of each type)
    const recentFD = await FixedDeposit.find()
      .populate('investorId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentMF = await MutualFund.find()
      .populate('investorId', 'name')
      .populate('schemeId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Counts
    const totalAMCs = await AMC.countDocuments({ status: 'Active' });
    const totalSchemes = await Scheme.countDocuments({ status: 'Active' });
    const totalGroups = await Group.countDocuments({ status: 'Active' });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalInvestors,
          totalPortfolio: parseFloat(totalPortfolio.toFixed(2)),
          totalFD: parseFloat(totalFD.toFixed(2)),
          totalMF: parseFloat(totalMFInvested.toFixed(2)),
          totalShares: parseFloat(totalSharesInvested.toFixed(2)),
          totalAMCs,
          totalSchemes,
          totalGroups,
        },
        assetAllocation,
        amcDistribution,
        monthlyTrend: {
          mf: monthlyMF,
          fd: monthlyFD,
        },
        recentActivity: {
          fd: recentFD.map((fd) => ({
            type: 'Fixed Deposit',
            investor: fd.investorId?.name || 'N/A',
            amount: fd.amount,
            bank: fd.bankName,
            date: fd.effectiveDate,
          })),
          mf: recentMF.map((mf) => ({
            type: `MF ${mf.type}`,
            investor: mf.investorId?.name || 'N/A',
            amount: mf.amount,
            scheme: mf.schemeId?.name || 'N/A',
            date: mf.transactionDate,
          })),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats };
