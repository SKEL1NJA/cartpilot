const crypto = require('crypto');
const Customer = require('../models/Customer');
const Conversation = require('../models/Conversation');
const Merchant = require('../models/Merchant');
const { getRecentMessages } = require('../utils/context');

// POST /api/chat
async function handleChatMessage(req, res) {
  try {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'A "message" string is required' });
    }

    // Step A: find or create the customer
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

    const recentContext = getRecentMessages(conversation);
    const reply = `(stub) I heard ${recentContext.length} recent message(s). You said: "${message}"`;

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