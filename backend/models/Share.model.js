const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema(
  {
    investorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    transactionDate: { type: Date, required: true },
    type: { type: String, enum: ['Buy', 'Sell'], required: true },
    exchange: { type: String, enum: ['BSE', 'NSE'], required: true, default: 'NSE' },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }, // buy or sell price per share
    brokerage: { type: Number, default: 0, min: 0 },
    // Calculated
    totalAmount: { type: Number, default: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// Auto-calculate totalAmount before save
shareSchema.pre('save', function (next) {
  this.totalAmount = this.quantity * this.price + this.brokerage;
  next();
});

module.exports = mongoose.model('Share', shareSchema);
