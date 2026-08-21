const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true }, // stored in paise
  category: { type: String, required: true },
  tags: { type: [String], default: [] },
  stock: { type: Number, required: true, default: 0 },
  isUpsellEligible: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);