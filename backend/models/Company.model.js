const mongoose = require('mongoose');

// Company / Bank Master
// flag: 'C' = Company (has ISIN), 'B' = Bank (no ISIN)
const companySchema = new mongoose.Schema(
  {
    code:   { type: String, trim: true, default: '' },       // Company / Bank Code
    name:   { type: String, required: true, trim: true },    // Company / Bank Name
    flag:   { type: String, enum: ['C', 'B'], required: true, default: 'C' }, // C=Company, B=Bank
    isin:   { type: String, trim: true, default: '' },       // ISIN (only if flag = 'C')
    sector: { type: String, trim: true, default: '' },       // Sector Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', companySchema);
