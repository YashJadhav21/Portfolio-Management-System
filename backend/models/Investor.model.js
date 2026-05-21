const mongoose = require('mongoose');

const investorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    pan: { type: String, required: true, uppercase: true, trim: true },
    address: { type: String, trim: true, default: '' },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Investor', investorSchema);
