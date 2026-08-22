// POST /api/chat
async function handleChatMessage(req, res) {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'A "message" string is required' });
  }

  // Placeholder response — real AI reasoning arrives in Day 5-6
  res.status(200).json({
    reply: `You said: "${message}". (AI reasoning not connected yet.)`
  });
}

module.exports = { handleChatMessage };