const mongoose = require('mongoose');

const amcSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    registrationNo: { type: String, trim: true, default: '' },
    email: { type: String, lowercase: true, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AMC', amcSchema);
