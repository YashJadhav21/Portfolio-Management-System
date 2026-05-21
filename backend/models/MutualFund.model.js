const mongoose = require('mongoose');

const mutualFundSchema = new mongoose.Schema(
  {
    investorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor', required: true },
    amcId: { type: mongoose.Schema.Types.ObjectId, ref: 'AMC', required: true },
    schemeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scheme', required: true },
    transactionDate: { type: Date, required: true },
    type: { type: String, enum: ['Purchase', 'Redemption'], required: true },
    units: { type: Number, required: true, min: 0 },
    nav: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MutualFund', mutualFundSchema);
