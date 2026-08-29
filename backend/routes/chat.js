const express = require('express');
const router = express.Router();
const { handleChatMessage, getConversationState } = require('../controllers/chatController');

router.post('/', handleChatMessage);
router.get('/:sessionId', getConversationState);

module.exports = router;