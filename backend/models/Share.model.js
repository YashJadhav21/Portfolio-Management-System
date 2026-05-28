const mongoose = require('mongoose');

// Shares — Purchase / Sales
const shareSchema = new mongoose.Schema(
  {
    investorId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Investor', required: true },
    effectiveDate:    { type: Date, required: true },             // Effective Date
    bseNseFlag:       { type: String, enum: ['BSE', 'NSE'], required: true }, // BSE / NSE Flag
    companyId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }, // Scrip Code → Scrip Name
    isin:             { type: String, trim: true, default: '' },  // ISIN
    sector:           { type: String, trim: true, default: '' },  // Sector
    type:             { type: String, enum: ['Purchase', 'Sales'], required: true },
    jointHolder1:     { type: String, trim: true, default: '' },  // Joint Holder 1
    jointHolder2:     { type: String, trim: true, default: '' },  // Joint Holder 2
    amount:           { type: Number, default: 0 },               // Amount Invested
    firstDividendDate:{ type: Date, default: null },             // First Dividend Date
    price:            { type: Number, default: 0 },               // Price per share
    noOfShares:       { type: Number, default: 0 },               // No. of Shares
  },
  { timestamps: true }
);

module.exports = mongoose.model('Share', shareSchema);
