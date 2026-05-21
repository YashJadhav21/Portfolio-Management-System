const FixedDeposit = require('../models/FixedDeposit.model');

// Calculate FD maturity amount (compound interest)
const calculateFD = (amount, rate, tenureMonths) => {
  const years = tenureMonths / 12;
  const maturityAmount = amount * Math.pow(1 + rate / 100, years);
  const interestEarned = maturityAmount - amount;
  return {
    maturityAmount: parseFloat(maturityAmount.toFixed(2)),
    interestEarned: parseFloat(interestEarned.toFixed(2)),
  };
};

// GET all FDs
const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status, investorId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (status) filter.status = status;
    if (investorId) filter.investorId = investorId;
    if (search) {
      filter.bankName = { $regex: search, $options: 'i' };
    }

    const [data, total] = await Promise.all([
      FixedDeposit.find(filter)
        .populate('investorId', 'name email')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      FixedDeposit.countDocuments(filter),
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

// GET one FD
const getOne = async (req, res) => {
  try {
    const fd = await FixedDeposit.findById(req.params.id).populate('investorId', 'name email');
    if (!fd) return res.status(404).json({ success: false, message: 'FD not found' });
    res.status(200).json({ success: true, data: fd });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE FD
const create = async (req, res) => {
  try {
    const { amount, interestRate, tenureMonths } = req.body;
    const { maturityAmount, interestEarned } = calculateFD(amount, interestRate, tenureMonths);

    const fd = await FixedDeposit.create({
      ...req.body,
      maturityAmount,
      interestEarned,
    });

    res.status(201).json({ success: true, data: fd, message: 'FD created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE FD
const update = async (req, res) => {
  try {
    const { amount, interestRate, tenureMonths } = req.body;
    let updateData = { ...req.body };

    if (amount && interestRate && tenureMonths) {
      const { maturityAmount, interestEarned } = calculateFD(amount, interestRate, tenureMonths);
      updateData.maturityAmount = maturityAmount;
      updateData.interestEarned = interestEarned;
    }

    const fd = await FixedDeposit.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!fd) return res.status(404).json({ success: false, message: 'FD not found' });
    res.status(200).json({ success: true, data: fd, message: 'FD updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE FD
const remove = async (req, res) => {
  try {
    const fd = await FixedDeposit.findByIdAndDelete(req.params.id);
    if (!fd) return res.status(404).json({ success: false, message: 'FD not found' });
    res.status(200).json({ success: true, message: 'FD deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getOne, create, update, remove };
