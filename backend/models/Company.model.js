const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    symbol: { type: String, required: true, uppercase: true, trim: true, unique: true },
    exchange: { type: String, enum: ['BSE', 'NSE', 'Both'], default: 'Both' },
    securityCode: { type: String, trim: true, default: '' },
    issuerName: { type: String, trim: true, default: '' },
    securityId: { type: String, trim: true, default: '' },
    securityName: { type: String, trim: true, default: '' },
    series: { type: String, trim: true, default: '' },
    listedOn: { type: Date, default: null },
    paidUpValue: { type: Number, default: null },
    marketLot: { type: Number, default: null },
    isin: { type: String, trim: true, default: '' },
    faceValue: { type: Number, default: null },
    bseGroup: { type: String, trim: true, default: '' },
    instrument: { type: String, trim: true, default: '' },
    sector: { type: String, trim: true, default: '' },
    industry: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', companySchema);
