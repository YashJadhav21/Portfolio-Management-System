const mongoose = require('mongoose');

// AMC Master — AMC Code + AMC Name only
const amcSchema = new mongoose.Schema(
  {
    code: { type: String, trim: true, default: '' },     // AMC Code
    name: { type: String, required: true, trim: true },  // AMC Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('AMC', amcSchema);
