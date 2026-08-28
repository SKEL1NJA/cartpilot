const { runCartRecoveryScan } = require('../agent/cartRecovery');
const Conversation = require('../models/Conversation');

async function scanForAbandonedCarts(req, res) {
  try {
    const results = await runCartRecoveryScan();
    res.status(200).json({ recoveredCount: results.length, results });
  } catch (err) {
    res.status(500).json({ error: 'Cart recovery scan failed', details: err.message });
  }
}

async function listRecoveryOffers(req, res) {
  try {
    const conversations = await Conversation.find({ recoveryOfferSent: true })
      .sort({ updatedAt: -1 })
      .limit(20);
    res.status(200).json(conversations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recovery offers', details: err.message });
  }
}

module.exports = { scanForAbandonedCarts, listRecoveryOffers };