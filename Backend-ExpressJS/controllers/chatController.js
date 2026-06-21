// Backend-ExpressJS/controllers/chatController.js
const chatService = require('../services/chatService');

exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const conversations = await chatService.getUserConversations(userId);
    res.status(200).json({ success: true, data: conversations });
  } catch (error) {
    next(error);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const messages = await chatService.getConversationMessages(conversationId, userId);
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { conversationId, body, fileUrl, fileName, fileType } = req.body;
    if (!conversationId) {
      return res.status(400).json({ success: false, message: 'Missing conversationId' });
    }
    const senderId = req.user.id;
    const message = await chatService.sendMessage(conversationId, senderId, body, fileUrl, fileName, fileType);
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    await chatService.markMessagesAsRead(conversationId, userId);
    res.status(200).json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};

exports.getOrCreateConversation = async (req, res, next) => {
  try {
    const { peerId } = req.body;
    if (!peerId) {
      return res.status(400).json({ success: false, message: 'peerId is required' });
    }
    const userId = req.user.id;
    const conversationId = await chatService.getOrCreateConversation(userId, peerId);
    res.status(200).json({ success: true, conversationId });
  } catch (error) {
    next(error);
  }
};