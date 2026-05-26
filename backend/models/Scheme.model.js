const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema(
  {
    code: { type: String, trim: true, unique: true, sparse: true, default: '' },
    name: { type: String, required: true, trim: true },
    amcId: { type: mongoose.Schema.Types.ObjectId, ref: 'AMC', required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory', default: null },
    schemeType: { type: String, trim: true, default: '' },
    schemeCategory: { type: String, trim: true, default: '' },
    schemeNavName: { type: String, trim: true, default: '' },
    minimumAmount: { type: String, trim: true, default: '' },
    launchDate: { type: Date, default: null },
    closureDate: { type: Date, default: null },
    isin: { type: String, trim: true, default: '' },
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
