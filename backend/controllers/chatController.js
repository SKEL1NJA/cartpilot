const crypto = require('crypto');
const Customer = require('../models/Customer');
const Conversation = require('../models/Conversation');
const Merchant = require('../models/Merchant');
const Product = require('../models/Product');
const { getRecentMessages } = require('../utils/context');
const { generateReply } = require('../services/geminiService');

// POST /api/chat
async function handleChatMessage(req, res) {
  try {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'A "message" string is required' });
    }

    const activeSessionId = sessionId || crypto.randomUUID();
    let customer = await Customer.findOne({ sessionId: activeSessionId });
    if (!customer) {
      customer = await Customer.create({ sessionId: activeSessionId });
    }

    const merchant = await Merchant.findOne();
    if (!merchant) {
      return res.status(500).json({ error: 'No merchant configured. Run the seed script.' });
    }

    let conversation = await Conversation.findOne({
      customerId: customer._id,
      status: 'active'
    });
    if (!conversation) {
      conversation = await Conversation.create({
        customerId: customer._id,
        merchantId: merchant._id,
        messages: []
      });
    }

    conversation.messages.push({ role: 'user', content: message });

    const products = await Product.find({ merchantId: merchant._id });
    const recentMessages = getRecentMessages(conversation);

    let reply;
    try {
      reply = await generateReply({ merchant, products, recentMessages });
    } catch (aiError) {
      console.error('Gemini call failed:', aiError.message);
      reply = "Sorry, I'm having trouble thinking right now — please try again in a moment.";
    }

    conversation.messages.push({ role: 'agent', content: reply });
    conversation.updatedAt = new Date();
    await conversation.save();

    res.status(200).json({
      reply,
      sessionId: activeSessionId,
      conversationId: conversation._id
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process chat message', details: err.message });
  }
}

module.exports = { handleChatMessage };