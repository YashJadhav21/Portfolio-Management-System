const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    code: { type: String, trim: true, default: '' },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
