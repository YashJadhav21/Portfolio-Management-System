const mongoose = require('mongoose');

/* Fixed Income — Fresh Fixed Deposit
   Fields from screenshot:
   - Effective Date
   - Sub-Category Code  (BNFD, CNFD, BCFD, CCFD, CD, NCD, PMIS, PTD, Insurance Annuity)
   - Company / Bank Code  (ref to Company)
   - Joint Holder 1
   - Joint Holder 2
   - Deposit Amount
   - Interest Rate
   - First Interest Date
   - Maturity Date
   - Maturity Amount
*/
const fixedDepositSchema = new mongoose.Schema(
  {
    investorId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Investor', required: true },
    effectiveDate:    { type: Date, required: true },
    subcategoryCode:  {
      type: String,
      enum: ['BNFD', 'CNFD', 'BCFD', 'CCFD', 'CD', 'NCD', 'PMIS', 'PTD', 'Insurance Annuity'],
      required: true,
    },
    companyId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }, // Company / Bank Code
    jointHolder1:     { type: String, trim: true, default: '' },
    jointHolder2:     { type: String, trim: true, default: '' },
    depositAmount:    { type: Number, required: true, min: 0 },
    interestRate:     { type: Number, required: true, min: 0, max: 100 },
    firstInterestDate:{ type: Date, default: null },
    maturityDate:     { type: Date, required: true },
    maturityAmount:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FixedDeposit', fixedDepositSchema);
