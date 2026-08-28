const Conversation = require('../models/Conversation');
const Product = require('../models/Product');
const Merchant = require('../models/Merchant');
const AgentDecision = require('../models/AgentDecision');
const razorpay = require('../services/razorpayService');
const { callGemini } = require('../services/geminiService');

const ABANDON_THRESHOLD_MINUTES = Number(process.env.ABANDON_THRESHOLD_MINUTES || 30);

async function findAbandonedConversations() {
  const cutoff = new Date(Date.now() - ABANDON_THRESHOLD_MINUTES * 60 * 1000);
  return Conversation.find({
    status: 'active',
    recoveryOfferSent: false,
    updatedAt: { $lt: cutoff },
    messages: { $ne: [] }
  });
}

async function draftRecoveryMessage({ product, conversation, discountPercent }) {
  const systemInstruction = `You are CartPilot, drafting a short, warm cart-recovery message for a shopper who chatted about a product but never completed checkout.
Keep it under 40 words, friendly, no pressure tactics, mention the product by name and the discount.`;

  const transcript = conversation.messages.map(m => `${m.role}: ${m.content}`).join('\n');

  const contents = [{
    role: 'user',
    parts: [{
      text: `Product: ${product.name} (₹${product.price / 100})\nDiscount offered: ${discountPercent}%\nPast conversation:\n${transcript}\n\nWrite the recovery message.`
    }]
  }];

  const response = await callGemini({ contents, systemInstruction });
  return response.text.trim();
}

async function runCartRecoveryScan() {
  const merchant = await Merchant.findOne();
  const abandoned = await findAbandonedConversations();
  const results = [];

  for (const conversation of abandoned) {
    const lastDecision = await AgentDecision.findOne({ conversationId: conversation._id })
      .sort({ createdAt: -1 });
    if (!lastDecision) continue;

    const product = await Product.findById(lastDecision.productId);
    if (!product) continue;

    const discountPercent = merchant.discountApprovalThreshold;

    let message;
    try {
      message = await draftRecoveryMessage({ product, conversation, discountPercent });
    } catch (err) {
      console.error('Cart recovery message generation failed:', err.message);
      message = `We saved your cart! Here's ${discountPercent}% off ${product.name} if you'd like to complete your purchase.`;
    }

    const decision = await AgentDecision.create({
      conversationId: conversation._id,
      merchantId: merchant._id,
      productId: product._id,
      decisionType: 'discount',
      discountPercent,
      reason: 'Cart recovery offer for an abandoned conversation, capped at the merchant auto-approval threshold.',
      status: 'auto_approved'
    });

    const discountedAmount = Math.round(product.price * (1 - discountPercent / 100));

    const paymentLink = await razorpay.paymentLink.create({
      amount: discountedAmount,
      currency: 'INR',
      description: `${product.name} — ${discountPercent}% cart recovery offer`,
      notes: {
        conversationId: conversation._id.toString(),
        decisionId: decision._id.toString()
      }
    });

    conversation.recoveryOfferSent = true;
    conversation.recoveryPaymentLink = paymentLink.short_url;
    conversation.recoveryMessage = message;
    conversation.status = 'abandoned';
    await conversation.save();

    results.push({
      conversationId: conversation._id,
      product: product.name,
      discountPercent,
      message,
      paymentLink: paymentLink.short_url
    });
  }

  return results;
}

module.exports = { runCartRecoveryScan, findAbandonedConversations };