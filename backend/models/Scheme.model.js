const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    amcId: { type: mongoose.Schema.Types.ObjectId, ref: 'AMC', required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory', default: null },
    riskLevel: {
      type: String,
      enum: ['Low', 'Moderate', 'High', 'Very High'],
      default: 'Moderate',
    },
    nav: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Scheme', schemeSchema);
