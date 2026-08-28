const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'agent'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const conversationSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
  messages: { type: [messageSchema], default: [] },
  status: { type: String, enum: ['active', 'abandoned', 'completed'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  recoveryOfferSent: { type: Boolean, default: false },
  recoveryPaymentLink: { type: String },
  recoveryMessage: { type: String }
});

module.exports = mongoose.model('Conversation', conversationSchema);