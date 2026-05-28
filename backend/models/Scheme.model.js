const mongoose = require('mongoose');

// Scheme Master — AMC Code, AMC Name, Scheme Code, Scheme Name, ISIN, Type of MF, D/G Flag
const schemeSchema = new mongoose.Schema(
  {
    amcId:      { type: mongoose.Schema.Types.ObjectId, ref: 'AMC', required: true }, // AMC Code (lookup)
    schemeCode: { type: String, trim: true, default: '' },   // Scheme Code
    name:       { type: String, required: true, trim: true },// Scheme Name
    isin:       { type: String, trim: true, default: '' },   // ISIN
    mfType:     { type: String, trim: true, default: '' },   // Type of MF
    dgFlag:     { type: String, enum: ['Dividend', 'Growth', ''], default: '' }, // D/G Flag
  },
  { timestamps: true }
);

module.exports = mongoose.model('Scheme', schemeSchema);
