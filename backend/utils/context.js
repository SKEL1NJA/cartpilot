const MAX_CONTEXT_MESSAGES = 8;

function getRecentMessages(conversation) {
  return conversation.messages.slice(-MAX_CONTEXT_MESSAGES);
}

module.exports = { getRecentMessages, MAX_CONTEXT_MESSAGES };