const mongoose = require('mongoose');

const merchantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  discountApprovalThreshold: { type: Number, required: true, default: 10 }, // percent
  maxDiscountPercent: { type: Number, required: true, default: 25 }, // hard ceiling
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Merchant', merchantSchema);