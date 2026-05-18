const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getQuizMessages,
  getGlobalMessages,
  deleteMessage,
  getChatStats,
  createMessage,
  markMessagesAsRead,
  // NEW: Conversation endpoints
  getConversationMessages,
  startConversation,
  markConversationAsRead,
  clearConversation,
  reportMessage,
  reportChat
} = require('../controllers/chatController');

const router = express.Router();

router.use(protect);

// Quiz chat routes
router.get('/quiz/:quizId', getQuizMessages);
router.post('/quiz/:quizId/read', markMessagesAsRead);

// Global chat routes
router.get('/global', getGlobalMessages);

// Message management
router.post('/message', createMessage);
router.delete('/message/:messageId', deleteMessage);
router.post('/message/:messageId/report', reportMessage);

// Chat statistics
router.get('/stats', getChatStats);

// NEW: Conversation routes for private messaging
router.get('/conversation/:otherUserId', getConversationMessages);
router.post('/conversation/start', startConversation);
router.post('/conversation/:otherUserId/read', markConversationAsRead);
router.delete('/conversation/:otherUserId', clearConversation);

// NEW: Chat reporting
router.post('/report', reportChat);

module.exports = router;