// Backend-ExpressJS/routes/chat.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { isAuthenticated } = require('../middleware/authMiddleware'); // adjust to your auth middleware

// All chat routes require authentication
router.use(isAuthenticated);

router.get('/conversations', chatController.getConversations);
router.get('/messages/:conversationId', chatController.getMessages);
router.post('/message', chatController.sendMessage);
router.put('/read/:conversationId', chatController.markAsRead);
router.post('/conversation', chatController.getOrCreateConversation);

module.exports = router;