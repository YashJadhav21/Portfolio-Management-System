const MutualFund = require('../models/MutualFund.model');

// GET all MF transactions
const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', type, investorId, schemeId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (type) filter.type = type;
    if (investorId) filter.investorId = investorId;
    if (schemeId) filter.schemeId = schemeId;

    const [data, total] = await Promise.all([
      MutualFund.find(filter)
        .populate('investorId', 'name email')
        .populate('amcId', 'name')
        .populate('schemeId', 'name nav')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ transactionDate: -1 }),
      MutualFund.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET MF Holdings (net units per scheme per investor)
const getHoldings = async (req, res) => {
  try {
    const holdings = await MutualFund.aggregate([
      {
        $group: {
          _id: { investorId: '$investorId', schemeId: '$schemeId' },
          totalPurchasedUnits: {
            $sum: { $cond: [{ $eq: ['$type', 'Purchase'] }, '$units', 0] },
          },
          totalRedeemedUnits: {
            $sum: { $cond: [{ $eq: ['$type', 'Redemption'] }, '$units', 0] },
          },
          totalInvested: {
            $sum: { $cond: [{ $eq: ['$type', 'Purchase'] }, '$amount', 0] },
          },
          totalRedeemed: {
            $sum: { $cond: [{ $eq: ['$type', 'Redemption'] }, '$amount', 0] },
          },
        },
      },
      {
        $addFields: {
          netUnits: { $subtract: ['$totalPurchasedUnits', '$totalRedeemedUnits'] },
        },
      },
      { $match: { netUnits: { $gt: 0 } } },
      {
        $lookup: {
          from: 'investors',
          localField: '_id.investorId',
          foreignField: '_id',
          as: 'investor',
        },
      },
      {
        $lookup: {
          from: 'schemes',
          localField: '_id.schemeId',
          foreignField: '_id',
          as: 'scheme',
        },
      },
      { $unwind: '$investor' },
      { $unwind: '$scheme' },
      {
        $project: {
          investor: { name: 1, email: 1 },
          scheme: { name: 1, nav: 1 },
          netUnits: 1,
          totalInvested: 1,
          totalRedeemed: 1,
          currentValue: { $multiply: ['$netUnits', '$scheme.nav'] },
        },
      },
    ]);

    res.status(200).json({ success: true, data: holdings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE MF transaction
const create = async (req, res) => {
  try {
    const mf = await MutualFund.create(req.body);
    res.status(201).json({ success: true, data: mf, message: 'Transaction recorded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE
const update = async (req, res) => {
  try {
    const mf = await MutualFund.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!mf) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.status(200).json({ success: true, data: mf, message: 'Updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE
const remove = async (req, res) => {
  try {
    const mf = await MutualFund.findByIdAndDelete(req.params.id);
    if (!mf) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getHoldings, create, update, remove };
