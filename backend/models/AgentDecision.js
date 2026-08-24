const mongoose = require('mongoose');

const agentDecisionSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  decisionType: { type: String, enum: ['upsell', 'discount'], required: true },
  discountPercent: { type: Number },
  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ['proposed', 'auto_approved', 'pending_approval', 'approved', 'rejected'],
    default: 'proposed'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AgentDecision', agentDecisionSchema);