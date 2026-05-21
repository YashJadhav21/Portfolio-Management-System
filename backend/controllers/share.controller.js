const Share = require('../models/Share.model');

// GET all share transactions
const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', type, investorId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (type) filter.type = type;
    if (investorId) filter.investorId = investorId;

    const [data, total] = await Promise.all([
      Share.find(filter)
        .populate('investorId', 'name email')
        .populate('companyId', 'name symbol sector')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ transactionDate: -1 }),
      Share.countDocuments(filter),
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

// GET Share Holdings (net position per company per investor)
const getHoldings = async (req, res) => {
  try {
    const holdings = await Share.aggregate([
      {
        $group: {
          _id: { investorId: '$investorId', companyId: '$companyId' },
          totalBought: { $sum: { $cond: [{ $eq: ['$type', 'Buy'] }, '$quantity', 0] } },
          totalSold: { $sum: { $cond: [{ $eq: ['$type', 'Sell'] }, '$quantity', 0] } },
          totalBuyAmount: {
            $sum: { $cond: [{ $eq: ['$type', 'Buy'] }, '$totalAmount', 0] },
          },
          totalSellAmount: {
            $sum: { $cond: [{ $eq: ['$type', 'Sell'] }, '$totalAmount', 0] },
          },
        },
      },
      {
        $addFields: {
          netQuantity: { $subtract: ['$totalBought', '$totalSold'] },
          avgBuyPrice: {
            $cond: [
              { $gt: ['$totalBought', 0] },
              { $divide: ['$totalBuyAmount', '$totalBought'] },
              0,
            ],
          },
          realizedPnL: { $subtract: ['$totalSellAmount', '$totalBuyAmount'] },
        },
      },
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
          from: 'companies',
          localField: '_id.companyId',
          foreignField: '_id',
          as: 'company',
        },
      },
      { $unwind: '$investor' },
      { $unwind: '$company' },
      {
        $project: {
          investor: { name: 1 },
          company: { name: 1, symbol: 1, sector: 1 },
          netQuantity: 1,
          avgBuyPrice: 1,
          totalBuyAmount: 1,
          totalSellAmount: 1,
          realizedPnL: 1,
        },
      },
    ]);

    res.status(200).json({ success: true, data: holdings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE
const create = async (req, res) => {
  try {
    const share = new Share(req.body);
    await share.save(); // triggers pre-save hook for totalAmount
    res.status(201).json({ success: true, data: share, message: 'Transaction recorded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE
const update = async (req, res) => {
  try {
    const share = await Share.findById(req.params.id);
    if (!share) return res.status(404).json({ success: false, message: 'Transaction not found' });

    Object.assign(share, req.body);
    await share.save();

    res.status(200).json({ success: true, data: share, message: 'Updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE
const remove = async (req, res) => {
  try {
    const share = await Share.findByIdAndDelete(req.params.id);
    if (!share) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getHoldings, create, update, remove };
