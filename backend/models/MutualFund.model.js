const mongoose = require('mongoose');

const mutualFundSchema = new mongoose.Schema(
  {
    investorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor', required: true },
    amcId: { type: mongoose.Schema.Types.ObjectId, ref: 'AMC', required: true },
    amcType: { type: String, trim: true, default: '' },
    schemeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scheme', required: true },
    effectiveDate: { type: Date, required: true },
    transactionDate: { type: Date },
    type: { type: String, enum: ['Purchase', 'Redemption'], required: true },
    mfType: { type: String, enum: ['Dividend', 'Growth'], default: 'Growth' },
    jointHolder1: { type: String, trim: true, default: '' },
    jointHolder2: { type: String, trim: true, default: '' },
    amount: { type: Number, required: true, min: 0 },
    firstDividendDate: { type: Date },
    nav: { type: Number, min: 0, default: 0 },
    units: { type: Number, min: 0, default: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MutualFund', mutualFundSchema);
