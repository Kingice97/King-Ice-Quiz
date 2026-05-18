const Message = require('../models/Message');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Report = require('../models/Report');

// @desc    Get messages for a quiz
// @route   GET /api/chat/quiz/:quizId
// @access  Private
exports.getQuizMessages = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const { limit = 50 } = req.query;

    console.log(`📥 Fetching messages for quiz: ${quizId}, limit: ${limit}`);

    const messages = await Message.find({ 
      quiz: quizId,
      isDeleted: false 
    })
    .sort({ timestamp: 1 }) // Oldest first for proper chat display
    .limit(parseInt(limit))
    .populate('user', 'username profile.picture')
    .lean();

    // Format the response to ensure consistent data structure
    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      quiz: msg.quiz,
      user: msg.user?._id || msg.user,
      username: msg.user?.username || msg.username,
      profilePicture: msg.user?.profile?.picture || msg.profilePicture,
      message: msg.message,
      timestamp: msg.timestamp,
      isDeleted: msg.isDeleted
    }));

    console.log(`✅ Found ${formattedMessages.length} messages for quiz ${quizId}`);

    res.json({
      success: true,
      data: formattedMessages,
      count: formattedMessages.length
    });
  } catch (error) {
    console.error('❌ Get quiz messages error:', error);
    next(error);
  }
};

// @desc    Get global chat messages
// @route   GET /api/chat/global
// @access  Private
exports.getGlobalMessages = async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;

    console.log(`📥 Fetching global messages, limit: ${limit}`);

    // ✅ FIXED: Look for messages with room: 'global_chat' instead of quiz: 'global_chat'
    const messages = await Message.find({ 
      room: 'global_chat', // ✅ CORRECTED: Use room field for global chat
      isDeleted: false 
    })
    .sort({ timestamp: 1 }) // Oldest first for proper chat display
    .limit(parseInt(limit))
    .populate('user', 'username profile.picture')
    .lean();

    // Format the response to ensure consistent data structure
    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      room: msg.room,
      user: msg.user?._id || msg.user,
      username: msg.user?.username || msg.username,
      profilePicture: msg.user?.profile?.picture || msg.profilePicture,
      message: msg.message,
      timestamp: msg.timestamp,
      isDeleted: msg.isDeleted,
      type: msg.type || 'global' // ✅ Ensure type is included
    }));

    console.log(`✅ Found ${formattedMessages.length} global messages`);

    res.json({
      success: true,
      data: formattedMessages,
      count: formattedMessages.length
    });
  } catch (error) {
    console.error('❌ Get global messages error:', error);
    next(error);
  }
};

// @desc    Delete a message (own messages only)
// @route   DELETE /api/chat/message/:messageId
// @access  Private
exports.deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user owns the message
    if (message.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    message.isDeleted = true;
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete message error:', error);
    next(error);
  }
};

// @desc    Get chat statistics
// @route   GET /api/chat/stats
// @access  Private
exports.getChatStats = async (req, res, next) => {
  try {
    const totalMessages = await Message.countDocuments({ isDeleted: false });
    const userMessages = await Message.countDocuments({ 
      user: req.user.id,
      isDeleted: false 
    });

    // Get most active quizzes for chat
    const activeQuizzes = await Message.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$quiz',
          messageCount: { $sum: 1 },
          lastMessage: { $max: '$timestamp' }
        }
      },
      { $sort: { messageCount: -1 } },
      { $limit: 5 }
    ]);

    // Get user's chat activity
    const userChatStats = await Message.aggregate([
      { $match: { user: req.user._id, isDeleted: false } },
      {
        $group: {
          _id: '$quiz',
          messageCount: { $sum: 1 },
          lastMessage: { $max: '$timestamp' }
        }
      },
      { $sort: { lastMessage: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalMessages,
        userMessages,
        activeQuizzes,
        userChatStats
      }
    });
  } catch (error) {
    console.error('❌ Get chat stats error:', error);
    next(error);
  }
};

// @desc    Create a new message (for direct API calls)
// @route   POST /api/chat/message
// @access  Private
exports.createMessage = async (req, res, next) => {
  try {
    const { quizId, message } = req.body;

    if (!quizId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Quiz ID and message are required'
      });
    }

    const newMessage = new Message({
      quiz: quizId,
      user: req.user.id,
      username: req.user.username,
      profilePicture: req.user.profile?.picture,
      message: message.trim(),
      timestamp: new Date()
    });

    await newMessage.save();

    // Populate the message for response
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('user', 'username profile.picture')
      .lean();

    const formattedMessage = {
      _id: populatedMessage._id,
      quiz: populatedMessage.quiz,
      user: populatedMessage.user?._id,
      username: populatedMessage.user?.username,
      profilePicture: populatedMessage.user?.profile?.picture,
      message: populatedMessage.message,
      timestamp: populatedMessage.timestamp
    };

    res.status(201).json({
      success: true,
      data: formattedMessage,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('❌ Create message error:', error);
    next(error);
  }
};

// @desc    Mark messages as read for a quiz
// @route   POST /api/chat/quiz/:quizId/read
// @access  Private
exports.markMessagesAsRead = async (req, res, next) => {
  try {
    const { quizId } = req.params;

    // This would typically update a read status in the database
    // For now, we'll just return success since we're not tracking read status yet
    console.log(`📖 User ${req.user.username} marked messages as read for quiz ${quizId}`);

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('❌ Mark messages as read error:', error);
    next(error);
  }
};

// NEW: Get conversation messages
// @desc    Get conversation messages
// @route   GET /api/chat/conversation/:otherUserId
// @access  Private
exports.getConversationMessages = async (req, res, next) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.id;
    const { limit = 50 } = req.query;

    console.log(`📥 Fetching conversation messages with user: ${otherUserId}`);

    // Check if users have blocked each other
    const currentUser = await User.findById(userId);
    const otherUser = await User.findById(otherUserId);

    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if current user blocked the other user
    if (currentUser.blockedUsers && currentUser.blockedUsers.includes(otherUserId)) {
      return res.status(403).json({
        success: false,
        message: 'You have blocked this user'
      });
    }

    // Check if other user blocked current user
    if (otherUser.blockedUsers && otherUser.blockedUsers.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'This user has blocked you'
      });
    }

    // Get messages between users
    const userIds = [userId, otherUserId].sort();
    const roomId = `private_${userIds[0]}_${userIds[1]}`;

    const messages = await Message.find({
      room: roomId,
      isDeleted: false
    })
    .sort({ timestamp: 1 }) // Oldest first
    .limit(parseInt(limit))
    .populate('user', 'username profile.picture')
    .lean();

    // Format messages
    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      room: msg.room,
      user: msg.user?._id || msg.user,
      username: msg.user?.username || msg.username,
      profilePicture: msg.user?.profile?.picture || msg.profilePicture,
      message: msg.message,
      type: msg.type || 'private',
      timestamp: msg.timestamp,
      isDelivered: msg.isDelivered,
      isRead: msg.isRead
    }));

    console.log(`✅ Found ${formattedMessages.length} conversation messages`);

    res.json({
      success: true,
      data: formattedMessages,
      count: formattedMessages.length
    });
  } catch (error) {
    console.error('❌ Get conversation messages error:', error);
    next(error);
  }
};

// NEW: Start a conversation
// @desc    Start conversation
// @route   POST /api/chat/conversation/start
// @access  Private
exports.startConversation = async (req, res, next) => {
  try {
    const { otherUserId } = req.body;
    const userId = req.user.id;

    console.log(`💬 Starting conversation with user: ${otherUserId}`);

    // Check if users exist and aren't blocked
    const currentUser = await User.findById(userId);
    const otherUser = await User.findById(otherUserId);

    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check blocking status
    if (currentUser.blockedUsers && currentUser.blockedUsers.includes(otherUserId)) {
      return res.status(403).json({
        success: false,
        message: 'You have blocked this user'
      });
    }

    if (otherUser.blockedUsers && otherUser.blockedUsers.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'This user has blocked you'
      });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, otherUserId] }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [userId, otherUserId],
        lastMessageAt: new Date()
      });
      await conversation.save();
    }

    // Populate conversation
    conversation = await Conversation.findById(conversation._id)
      .populate('participants', 'username profile isOnline lastSeen')
      .populate('lastMessage');

    res.json({
      success: true,
      message: 'Conversation started successfully',
      data: {
        conversation: conversation,
        otherUser: {
          _id: otherUser._id,
          username: otherUser.username,
          profile: otherUser.profile,
          isOnline: otherUser.isOnline
        }
      }
    });
  } catch (error) {
    console.error('❌ Start conversation error:', error);
    next(error);
  }
};

// NEW: Mark conversation as read
// @desc    Mark conversation as read
// @route   POST /api/chat/conversation/:otherUserId/read
// @access  Private
exports.markConversationAsRead = async (req, res, next) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.id;

    console.log(`📖 Marking conversation as read with user: ${otherUserId}`);

    // Find conversation
    const conversation = await Conversation.findOne({
      participants: { $all: [userId, otherUserId] }
    });

    if (conversation) {
      // Reset unread count for current user
      conversation.unreadCount.set(userId.toString(), 0);
      await conversation.save();
    }

    // Mark messages as read
    const userIds = [userId, otherUserId].sort();
    const roomId = `private_${userIds[0]}_${userIds[1]}`;

    await Message.updateMany(
      {
        room: roomId,
        recipient: userId,
        isRead: false
      },
      {
        isRead: true
      }
    );

    res.json({
      success: true,
      message: 'Conversation marked as read'
    });
  } catch (error) {
    console.error('❌ Mark conversation as read error:', error);
    next(error);
  }
};

// NEW: Clear conversation
// @desc    Clear conversation
// @route   DELETE /api/chat/conversation/:otherUserId
// @access  Private
exports.clearConversation = async (req, res, next) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.id;

    console.log(`🗑️ Clearing conversation with user: ${otherUserId}`);

    // Get room ID
    const userIds = [userId, otherUserId].sort();
    const roomId = `private_${userIds[0]}_${userIds[1]}`;

    // Mark messages as deleted
    await Message.updateMany(
      {
        room: roomId,
        $or: [
          { user: userId },
          { recipient: userId }
        ]
      },
      {
        isDeleted: true
      }
    );

    res.json({
      success: true,
      message: 'Conversation cleared successfully'
    });
  } catch (error) {
    console.error('❌ Clear conversation error:', error);
    next(error);
  }
};

// NEW: Report message
// @desc    Report message
// @route   POST /api/chat/message/:messageId/report
// @access  Private
exports.reportMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { reason } = req.body;
    const reporterId = req.user.id;

    console.log(`🚨 Reporting message: ${messageId}`);

    const message = await Message.findById(messageId).populate('user', 'username email');

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Create report record
    const report = new Report({
      reporter: reporterId,
      reportedMessage: messageId,
      reportedUser: message.user._id,
      reason: reason,
      type: 'message',
      status: 'pending'
    });
    await report.save();

    // Log the report
    console.log('🚨 MESSAGE REPORT:');
    console.log('👤 Reporter:', req.user.username, `(${req.user.email})`);
    console.log('💬 Message:', message.message);
    console.log('👤 Reported User:', message.user.username, `(${message.user.email})`);
    console.log('📝 Reason:', reason);
    console.log('📅 Date:', new Date().toLocaleString());

    // TODO: Send email notification
    // await sendReportEmail(...);

    res.json({
      success: true,
      message: 'Message reported successfully. Our team will review it.'
    });
  } catch (error) {
    console.error('❌ Report message error:', error);
    next(error);
  }
};

// NEW: Report chat
// @desc    Report chat
// @route   POST /api/chat/report
// @access  Private
exports.reportChat = async (req, res, next) => {
  try {
    const { chatId, reason, type = 'chat' } = req.body;
    const reporterId = req.user.id;

    console.log(`🚨 Reporting ${type}: ${chatId}`);

    // Create report record
    const report = new Report({
      reporter: reporterId,
      reportedChat: chatId,
      reason: reason,
      type: type,
      status: 'pending'
    });
    await report.save();

    // Log the report
    console.log(`🚨 ${type.toUpperCase()} REPORT:`);
    console.log('👤 Reporter:', req.user.username, `(${req.user.email})`);
    console.log('💬 Chat ID:', chatId);
    console.log('📝 Reason:', reason);
    console.log('📅 Date:', new Date().toLocaleString());

    res.json({
      success: true,
      message: 'Report submitted successfully. Our team will review it.'
    });
  } catch (error) {
    console.error('❌ Report chat error:', error);
    next(error);
  }
};