const AgentDecision = require('../models/AgentDecision');

async function getPendingDecisions(req, res) {
  try {
    const decisions = await AgentDecision.find({ status: 'pending_approval' })
      .populate('productId', 'name price')
      .sort({ createdAt: -1 });
    res.status(200).json(decisions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending decisions', details: err.message });
  }
}

async function getAllDecisions(req, res) {
  try {
    const decisions = await AgentDecision.find({})
      .populate('productId', 'name price')
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json(decisions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch decisions', details: err.message });
  }
}

async function approveDecision(req, res) {
  try {
    const decision = await AgentDecision.findById(req.params.id);
    if (!decision) return res.status(404).json({ error: 'Decision not found' });
    if (decision.status !== 'pending_approval') {
      return res.status(400).json({ error: `Cannot approve a decision with status "${decision.status}"` });
    }
    decision.status = 'approved';
    await decision.save();
    res.status(200).json(decision);
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve decision', details: err.message });
  }
}

async function rejectDecision(req, res) {
  try {
    const decision = await AgentDecision.findById(req.params.id);
    if (!decision) return res.status(404).json({ error: 'Decision not found' });
    if (decision.status !== 'pending_approval') {
      return res.status(400).json({ error: `Cannot reject a decision with status "${decision.status}"` });
    }
    decision.status = 'rejected';
    await decision.save();
    res.status(200).json(decision);
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject decision', details: err.message });
  }
}

module.exports = { getPendingDecisions, getAllDecisions, approveDecision, rejectDecision };