const mongoose = require('mongoose');

const fixedDepositSchema = new mongoose.Schema(
  {
    investorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor', required: true },
    bankName: { type: String, required: true, trim: true },
    fdNumber: { type: String, trim: true, default: '' },
    effectiveDate: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    interestRate: { type: Number, required: true, min: 0, max: 100 }, // % per annum
    tenureMonths: { type: Number, required: true, min: 1 },
    maturityDate: { type: Date, required: true },
    interestFrequency: {
      type: String,
      enum: ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'On Maturity'],
      default: 'On Maturity',
    },
    // Calculated fields
    maturityAmount: { type: Number, default: 0 },
    interestEarned: { type: Number, default: 0 },
    status: { type: String, enum: ['Active', 'Matured', 'Premature Closed'], default: 'Active' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FixedDeposit', fixedDepositSchema);
