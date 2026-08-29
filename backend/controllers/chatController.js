const crypto = require('crypto');
const Customer = require('../models/Customer');
const Conversation = require('../models/Conversation');
const Merchant = require('../models/Merchant');
const Product = require('../models/Product');
const AgentDecision = require('../models/AgentDecision');
const { getRecentMessages } = require('../utils/context');
const { runAgent } = require('../agent/orchestrator');

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
    let toolCallLog = [];
    try {
      const result = await runAgent({
        merchant,
        products,
        recentMessages,
        conversationId: conversation._id
      });
      reply = result.reply;
      toolCallLog = result.toolCallLog;
    } catch (aiError) {
      console.error('Agent run failed:', aiError.message);
      reply = "Sorry, I'm having trouble thinking right now — please try again in a moment.";
    }

    conversation.messages.push({ role: 'agent', content: reply });
    conversation.updatedAt = new Date();
    await conversation.save();

    res.status(200).json({
      reply,
      sessionId: activeSessionId,
      conversationId: conversation._id,
      toolCallLog
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process chat message', details: err.message });
  }
}

async function getConversationState(req, res) {
  try {
    const { sessionId } = req.params;

    const customer = await Customer.findOne({ sessionId });
    if (!customer) {
      return res.status(200).json({ messages: [], decisions: [] });
    }

    const conversation = await Conversation.findOne({ customerId: customer._id }).sort({ updatedAt: -1 });
    if (!conversation) {
      return res.status(200).json({ messages: [], decisions: [] });
    }

    const decisions = await AgentDecision.find({ conversationId: conversation._id })
      .populate('productId', 'name')
      .sort({ createdAt: 1 });

    res.status(200).json({ messages: conversation.messages, decisions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load conversation', details: err.message });
  }
}

module.exports = { handleChatMessage, getConversationState };