const FixedDeposit = require('../models/FixedDeposit.model');

// GET all FDs
const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', investorId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (investorId) filter.investorId = investorId;
    if (search) {
      filter.$or = [
        { subcategoryCode: { $regex: search, $options: 'i' } },
        { jointHolder1: { $regex: search, $options: 'i' } },
        { jointHolder2: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      FixedDeposit.find(filter)
        .populate('investorId', 'name email')
        .populate('companyId', 'name code flag')
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
    const fd = await FixedDeposit.findById(req.params.id)
      .populate('investorId', 'name email')
      .populate('companyId', 'name code flag');
    if (!fd) return res.status(404).json({ success: false, message: 'FD not found' });
    res.status(200).json({ success: true, data: fd });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE FD
const create = async (req, res) => {
  try {
    const fd = await FixedDeposit.create(req.body);
    res.status(201).json({ success: true, data: fd, message: 'Fixed Income record created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE FD
const update = async (req, res) => {
  try {
    const fd = await FixedDeposit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!fd) return res.status(404).json({ success: false, message: 'FD not found' });
    res.status(200).json({ success: true, data: fd, message: 'Updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE FD
const remove = async (req, res) => {
  try {
    const fd = await FixedDeposit.findByIdAndDelete(req.params.id);
    if (!fd) return res.status(404).json({ success: false, message: 'FD not found' });
    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getOne, create, update, remove };
