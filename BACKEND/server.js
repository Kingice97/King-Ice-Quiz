const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quizzes');
const resultRoutes = require('./routes/results');
const userRoutes = require('./routes/users');
const uploadRoutes = require('./routes/upload');
const chatRoutes = require('./routes/chat');

// Import middleware
const errorHandler = require('./middleware/error');
const auth = require('./middleware/auth');

// Import models
const Message = require('./models/Message');
const User = require('./models/User');
const Quiz = require('./models/Quiz');
const Conversation = require('./models/Conversation');

const app = express();
const httpServer = createServer(app);

// ✅ CORS Configuration for Production
const allowedOrigins = [
  'https://king-ice-quiz.vercel.app',
  'https://king-ice-quiz.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

// ✅ Simple and effective CORS
app.use(cors({
  origin: function (origin, callback) {
    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Allow requests with no origin
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed => 
      origin === allowed || origin.includes('king-ice-quiz')
    );
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log(`🌐 Allowing origin: ${origin}`);
      callback(null, true); // Still allow for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Handle preflight requests
app.options('*', cors());

// Socket.io setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  }
});

// Track online users
const onlineUsers = new Map();

// MongoDB connection
const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quizapp';
    
    if (!process.env.MONGODB_URI) {
      console.error('⚠️ MONGODB_URI environment variable is missing!');
      console.log('🔄 Using fallback database URL for development');
    }

    console.log('🔗 Attempting MongoDB connection...');
    
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5,
      retryWrites: true,
      w: 'majority'
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('🔄 Retrying database connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

// Connect to database
connectDB();

// ==================== SECURITY MIDDLEWARE ====================

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

// Custom security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Input sanitization
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (key.startsWith('$') || key === 'where' || key === 'expr') {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          sanitize(obj[key]);
        }
      });
    }
    return obj;
  };
  
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  
  next();
});

// Security logging
app.use((req, res, next) => {
  const securityEvents = ['login', 'register', 'password-reset', 'admin-action'];
  const path = req.path.toLowerCase();
  
  if (securityEvents.some(event => path.includes(event))) {
    console.log(`🔐 SECURITY EVENT: ${req.method} ${req.path} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
  }
  
  next();
});

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many upload attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/upload', uploadLimiter);

// ==================== STANDARD MIDDLEWARE ====================

// Compression middleware
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    skip: (req, res) => {
      return req.path === '/health' || req.path === '/api/status';
    }
  }));
}

// Body parsing
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  setHeaders: (res, path) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Request logging
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  }
  
  req.requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  next();
});

// ==================== ROUTES ====================

app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);

// Conversations route
app.get('/api/conversations', auth.protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    console.log(`💬 Fetching conversations for user: ${userId}`);
    
    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    })
    .populate('participants', 'username profile isOnline lastSeen')
    .populate('lastMessage')
    .sort({ lastMessageAt: -1 })
    .limit(50);

    console.log(`✅ Loaded ${conversations.length} conversations for user: ${userId}`);

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    const dbStatus = 'connected';
    
    res.status(200).json({
      success: true,
      message: 'Server is healthy 🟢',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()) + ' seconds',
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      },
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Server is unhealthy 🔴',
      database: 'disconnected',
      error: error.message
    });
  }
});

// API status route
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'King Ice Quiz API is running! 🚀',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: '/api/auth',
      quizzes: '/api/quizzes',
      results: '/api/results',
      users: '/api/users',
      upload: '/api/upload',
      chat: '/api/chat',
      conversations: '/api/conversations'
    }
  });
});

// Home route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to King Ice Quiz API! 📚',
    description: 'A comprehensive quiz application backend with real-time chat',
    version: '2.0.0',
    features: ['Quizzes', 'Real-time Chat', 'User Profiles', 'Profile Pictures', 'Private Messaging'],
    endpoints: {
      health: '/health',
      status: '/api/status',
      auth: '/api/auth',
      quizzes: '/api/quizzes',
      results: '/api/results',
      users: '/api/users',
      upload: '/api/upload',
      chat: '/api/chat',
      conversations: '/api/conversations'
    }
  });
});

// ==================== SOCKET.IO HANDLING ====================

io.on('connection', (socket) => {
  console.log(`🔗 User connected: ${socket.id}`);
  
  const userId = socket.handshake.auth?.userId;
  const username = socket.handshake.auth?.username;

  console.log('🔐 Socket authentication attempt:', { userId, username });

  // Validate user ID before proceeding
  if (!userId || userId === 'undefined' || userId === 'null' || userId === undefined) {
    console.error('❌ Invalid user ID provided in socket auth, disconnecting');
    socket.emit('authentication_error', { message: 'Invalid user ID' });
    socket.disconnect();
    return;
  }

  const validationTimeout = setTimeout(() => {
    console.error('❌ User validation timeout');
    socket.emit('authentication_error', { message: 'Authentication timeout' });
    socket.disconnect();
  }, 10000);

  // Validate user exists in database
  User.findById(userId).then(user => {
    clearTimeout(validationTimeout);
    
    if (!user) {
      console.error('❌ User not found in database, disconnecting');
      socket.emit('authentication_error', { message: 'User not found' });
      socket.disconnect();
      return;
    }

    console.log(`✅ Authenticated user: ${user.username} (${userId})`);
    
    // Add to online users
    onlineUsers.set(userId, {
      socketId: socket.id,
      username: user.username,
      userId: userId
    });
    
    // Join user's personal room
    socket.join(`user_${userId}`);
    
    // Update user online status
    User.findByIdAndUpdate(userId, { 
      isOnline: true, 
      lastSeen: new Date(),
      lastActivity: new Date()
    }).catch(err => console.error('Error updating user online status:', err));

    // Emit connection success
    socket.emit('connection_success', { 
      message: 'Successfully connected to chat',
      userId: userId,
      username: user.username
    });

    // NEW: Block user via socket
    socket.on('block_user', async (data, callback) => {
      try {
        const { userId: userToBlockId } = data;
        const currentUserId = socket.handshake.auth?.userId;

        if (!userToBlockId || !currentUserId) {
          if (callback) {
            callback({ success: false, error: 'Missing user IDs' });
          }
          return;
        }

        // Prevent blocking yourself
        if (userToBlockId === currentUserId) {
          if (callback) {
            callback({ success: false, error: 'Cannot block yourself' });
          }
          return;
        }

        // Check if user exists
        const userToBlock = await User.findById(userToBlockId);
        if (!userToBlock) {
          if (callback) {
            callback({ success: false, error: 'User not found' });
          }
          return;
        }

        // Add user to blocked list
        await User.findByIdAndUpdate(currentUserId, {
          $addToSet: { blockedUsers: userToBlockId }
        });

        console.log(`🚫 User ${currentUserId} blocked user ${userToBlockId}`);

        // Notify both users
        socket.emit('user_blocked', { 
          blockedUserId: userToBlockId,
          message: `You have blocked ${userToBlock.username}`
        });

        if (callback) {
          callback({ 
            success: true, 
            message: `You have blocked ${userToBlock.username}` 
          });
        }

      } catch (error) {
        console.error('❌ Block user socket error:', error);
        if (callback) {
          callback({ success: false, error: 'Failed to block user' });
        }
      }
    });

    // NEW: Unblock user via socket
    socket.on('unblock_user', async (data, callback) => {
      try {
        const { userId: userToUnblockId } = data;
        const currentUserId = socket.handshake.auth?.userId;

        if (!userToUnblockId || !currentUserId) {
          if (callback) {
            callback({ success: false, error: 'Missing user IDs' });
          }
          return;
        }

        // Check if user exists
        const userToUnblock = await User.findById(userToUnblockId);
        if (!userToUnblock) {
          if (callback) {
            callback({ success: false, error: 'User not found' });
          }
          return;
        }

        // Remove user from blocked list
        await User.findByIdAndUpdate(currentUserId, {
          $pull: { blockedUsers: userToUnblockId }
        });

        console.log(`✅ User ${currentUserId} unblocked user ${userToUnblockId}`);

        // Notify user
        socket.emit('user_unblocked', { 
          unblockedUserId: userToUnblockId,
          message: `You have unblocked ${userToUnblock.username}`
        });

        if (callback) {
          callback({ 
            success: true, 
            message: `You have unblocked ${userToUnblock.username}` 
          });
        }

      } catch (error) {
        console.error('❌ Unblock user socket error:', error);
        if (callback) {
          callback({ success: false, error: 'Failed to unblock user' });
        }
      }
    });

    // Room joining
    socket.on('join_quiz_room', (roomId) => {
      if (!roomId) {
        console.log('⚠️ No roomId provided for join_quiz_room');
        socket.emit('join_error', { error: 'No room ID provided' });
        return;
      }
      
      if (roomId.length > 100) {
        console.log('⚠️ Room ID too long');
        socket.emit('join_error', { error: 'Invalid room ID' });
        return;
      }
      
      const roomName = roomId === 'global_chat' ? 'global_chat' : `quiz_${roomId}`;
      
      socket.join(roomName);
      console.log(`📚 User ${user.username} joined room: ${roomName}`);
      
      socket.to(roomName).emit('user_joined', {
        username: user.username,
        message: `${user.username} joined the chat`,
        timestamp: new Date()
      });

      socket.emit('join_success', { roomId: roomId, roomName: roomName });
    });

    // Private chat
    socket.on('join_private_chat', (recipientId) => {
      if (!recipientId) {
        console.log('⚠️ No recipientId provided for join_private_chat');
        socket.emit('join_error', { error: 'No recipient ID provided' });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(recipientId)) {
        console.log('⚠️ Invalid recipient ID format');
        socket.emit('join_error', { error: 'Invalid recipient ID' });
        return;
      }

      const userIds = [userId, recipientId].sort();
      const roomId = `private_${userIds[0]}_${userIds[1]}`;
      
      socket.join(roomId);
      console.log(`🔐 User ${user.username} joined private chat room: ${roomId}`);
      
      socket.emit('join_private_success', { roomId: roomId, recipientId: recipientId });
    });

    // Message handling
    let messageCount = 0;
    let lastMessageTime = Date.now();
    
    socket.on('send_message', async (data, callback) => {
      try {
        const now = Date.now();
        if (now - lastMessageTime < 1000) {
          messageCount++;
          if (messageCount > 5) {
            if (callback) {
              callback({ success: false, error: 'Message rate limit exceeded' });
            }
            return;
          }
        } else {
          messageCount = 0;
          lastMessageTime = now;
        }

        console.log('📩 Received message:', data);
        
        const { quizId, userId, message, username, profilePicture } = data;
        
        if (!userId || !message || !username) {
          console.error('❌ Missing required fields for message');
          if (callback) {
            callback({ success: false, error: 'Missing required fields' });
          }
          return;
        }

        if (!message.trim()) {
          console.error('❌ Empty message');
          if (callback) {
            callback({ success: false, error: 'Message cannot be empty' });
          }
          return;
        }

        if (message.length > 1000) {
          if (callback) {
            callback({ success: false, error: 'Message too long' });
          }
          return;
        }

        let room, messageType, quiz;
        
        if (quizId === 'global_chat') {
          room = 'global_chat';
          messageType = 'global';
          quiz = null;
        } else {
          room = `quiz_${quizId}`;
          messageType = 'text';
          quiz = quizId;
          
          try {
            const quizExists = await Quiz.findById(quizId);
            if (!quizExists) {
              if (callback) {
                callback({ success: false, error: 'Quiz not found' });
              }
              return;
            }
          } catch (error) {
            console.error('Error validating quiz:', error);
            if (callback) {
              callback({ success: false, error: 'Invalid quiz ID' });
            }
            return;
          }
        }

        const newMessage = new Message({
          quiz: quiz,
          room: room,
          user: userId,
          username: username,
          message: message.trim(),
          profilePicture: profilePicture,
          type: messageType,
          timestamp: new Date()
        });
        
        await newMessage.save();
        
        const populatedMessage = {
          _id: newMessage._id,
          quiz: newMessage.quiz,
          room: newMessage.room,
          user: newMessage.user,
          username: newMessage.username,
          profilePicture: newMessage.profilePicture,
          message: newMessage.message,
          type: newMessage.type,
          timestamp: newMessage.timestamp
        };
        
        console.log(`💾 Message saved to DB: ${newMessage._id}`, { room, type: messageType });
        
        io.to(room).emit('receive_message', populatedMessage);
        console.log(`📤 Message broadcasted to room: ${room}`);
        
        await User.findByIdAndUpdate(userId, {
          $inc: { 'stats.messagesSent': 1 },
          lastActivity: new Date()
        });
        
        if (callback) {
          callback({ 
            success: true, 
            message: populatedMessage,
            messageId: newMessage._id
          });
        }
        
        console.log('✅ Message processed successfully');
        
      } catch (error) {
        console.error('❌ Error sending message:', error);
        
        if (callback) {
          callback({ 
            success: false, 
            error: 'Failed to send message: ' + error.message 
          });
        }
        
        socket.emit('message_error', {
          error: 'Failed to send message',
          details: error.message
        });
      }
    });

    // Private messages - FIXED VERSION with blocking check
    socket.on('send_private_message', async (data, callback) => {
      try {
        console.log('📩 Received private message:', data);
        
        const { recipientId, userId, username, message, profilePicture } = data;
        
        if (!recipientId || !userId || !message || !username) {
          console.error('❌ Missing required fields for private message');
          if (callback) {
            callback({ success: false, error: 'Missing required fields' });
          }
          return;
        }

        if (!message.trim()) {
          console.error('❌ Empty private message');
          if (callback) {
            callback({ success: false, error: 'Message cannot be empty' });
          }
          return;
        }

        if (message.length > 1000) {
          if (callback) {
            callback({ success: false, error: 'Message too long' });
          }
          return;
        }

        // NEW: Check if users have blocked each other
        const currentUser = await User.findById(userId);
        const recipientUser = await User.findById(recipientId);

        if (currentUser && currentUser.blockedUsers && currentUser.blockedUsers.includes(recipientId)) {
          if (callback) {
            callback({ success: false, error: 'You have blocked this user' });
          }
          return;
        }

        if (recipientUser && recipientUser.blockedUsers && recipientUser.blockedUsers.includes(userId)) {
          if (callback) {
            callback({ success: false, error: 'This user has blocked you' });
          }
          return;
        }

        // ✅ FIXED: Create consistent room ID
        const userIds = [userId, recipientId].sort();
        const roomId = `private_${userIds[0]}_${userIds[1]}`;

        // Find or create conversation
        const conversation = await Conversation.findOrCreate([userId, recipientId]);
        
        const newMessage = new Message({
          room: roomId, // ✅ Use the same room ID format
          user: userId,
          username: username,
          message: message.trim(),
          profilePicture: profilePicture,
          type: 'private',
          recipient: recipientId,
          conversation: conversation._id,
          isDelivered: false,
          isRead: false,
          timestamp: new Date()
        });
        
        await newMessage.save();
        
        // Update conversation
        conversation.lastMessage = newMessage._id;
        conversation.lastMessageAt = new Date();
        
        // ✅ FIXED: Increment unread count for recipient
        const recipientIdStr = recipientId.toString();
        const currentCount = conversation.unreadCount.get(recipientIdStr) || 0;
        conversation.unreadCount.set(recipientIdStr, currentCount + 1);
        
        await conversation.save();
        
        // Populate message for emission
        const populatedMessage = {
          _id: newMessage._id,
          room: roomId, // ✅ Consistent room ID
          user: userId,
          username: username,
          profilePicture: profilePicture,
          message: newMessage.message,
          type: 'private',
          recipient: recipientId,
          conversation: conversation._id,
          isDelivered: false,
          isRead: false,
          timestamp: newMessage.timestamp
        };
        
        console.log(`💾 Private message saved: ${newMessage._id} for room: ${roomId}`);
        
        // ✅ FIXED: Emit to both users using the same room ID
        const recipientOnline = onlineUsers.has(recipientId);
        
        // Always deliver to sender immediately
        socket.emit('receive_private_message', populatedMessage);
        
        // Deliver to recipient if online
        if (recipientOnline) {
          io.to(`user_${recipientId}`).emit('receive_private_message', populatedMessage);
          console.log(`📤 Private message delivered to online user: ${recipientId}`);
          
          // Mark as delivered
          await Message.findByIdAndUpdate(newMessage._id, { 
            isDelivered: true 
          });
          populatedMessage.isDelivered = true;
        } else {
          console.log(`💾 Private message stored for offline user: ${recipientId}`);
        }
        
        // Update conversation for both users
        const updatedConversation = await Conversation.findById(conversation._id)
          .populate('participants', 'username profile isOnline lastSeen')
          .populate('lastMessage');
        
        // Emit conversation update to both users
        io.to(`user_${userId}`).emit('conversation_updated', updatedConversation);
        if (recipientOnline) {
          io.to(`user_${recipientId}`).emit('conversation_updated', updatedConversation);
        }
        
        // Update user stats
        await User.findByIdAndUpdate(userId, {
          $inc: { 'stats.messagesSent': 1 },
          lastActivity: new Date()
        });
        
        if (callback) {
          callback({ 
            success: true, 
            message: populatedMessage,
            messageId: newMessage._id,
            delivered: recipientOnline
          });
        }
        
        console.log('✅ Private message processed successfully');
        
      } catch (error) {
        console.error('❌ Error sending private message:', error);
        
        if (callback) {
          callback({ 
            success: false, 
            error: 'Failed to send private message: ' + error.message 
          });
        }
      }
    });

   // Load private messages - FIXED VERSION
socket.on('load_private_messages', async (data, callback) => {
  try {
    const { recipientId } = data;
    const userId = socket.handshake.auth?.userId;

    if (!recipientId || !userId) {
      if (callback) {
        callback({ success: false, error: 'Missing user IDs' });
      }
      return;
    }

    // ✅ FIXED: Use consistent room ID format
    const userIds = [userId, recipientId].sort();
    const roomId = `private_${userIds[0]}_${userIds[1]}`;

    console.log(`📨 Loading private messages for room: ${roomId}`);

    // ✅ FIXED: Load messages in DESCENDING order (newest first) and increase limit
    const messages = await Message.find({
      room: roomId,
      isDeleted: false
    })
    .sort({ timestamp: -1 }) // ✅ CHANGED: Newest first
    .limit(200) // ✅ CHANGED: Increased limit
    .lean();

    console.log(`✅ Loaded ${messages.length} private messages for room: ${roomId}`);

    // ✅ FIXED: Mark messages as read and delivered for current user
    await Message.updateMany(
      {
        room: roomId,
        recipient: userId,
        isDelivered: false
      },
      {
        isDelivered: true,
        isRead: true
      }
    );

    // ✅ FIXED: Reset unread count for this conversation
    const conversation = await Conversation.findOne({
      participants: { $all: [userId, recipientId] }
    });
    
    if (conversation) {
      conversation.unreadCount.set(userId.toString(), 0);
      await conversation.save();
    }

    if (callback) {
      callback({ 
        success: true, 
        messages: messages, // ✅ These are now newest first
        roomId: roomId
      });
    }

  } catch (error) {
    console.error('❌ Error loading private messages:', error);
    if (callback) {
      callback({ success: false, error: 'Failed to load messages: ' + error.message });
    }
  }
});

    // Load conversations
    socket.on('load_conversations', async (callback) => {
      try {
        const userId = socket.handshake.auth?.userId;

        if (!userId) {
          if (callback) {
            callback({ success: false, error: 'User not authenticated' });
          }
          return;
        }

        const conversations = await Conversation.find({
          participants: userId,
          isActive: true
        })
        .populate('participants', 'username profile isOnline lastSeen')
        .populate('lastMessage')
        .sort({ lastMessageAt: -1 })
        .limit(50);

        console.log(`💬 Loaded ${conversations.length} conversations for user: ${userId}`);

        if (callback) {
          callback({ 
            success: true, 
            conversations: conversations
          });
        }

      } catch (error) {
        console.error('❌ Error loading conversations:', error);
        if (callback) {
          callback({ success: false, error: 'Failed to load conversations: ' + error.message });
        }
      }
    });

    // Typing indicators
    socket.on('typing_start', (data) => {
      const { quizId, username } = data;
      
      if (!quizId || !username) {
        console.log('⚠️ Missing quizId or username for typing_start');
        return;
      }
      
      console.log(`⌨️ ${username} started typing in ${quizId}`);
      
      const room = quizId === 'global_chat' ? 'global_chat' : `quiz_${quizId}`;
      
      socket.to(room).emit('user_typing', {
        quizId: quizId,
        username: username,
        isTyping: true
      });
    });

    socket.on('typing_stop', (data) => {
      const { quizId, username } = data;
      
      if (!quizId || !username) {
        console.log('⚠️ Missing quizId or username for typing_stop');
        return;
      }
      
      console.log(`💤 ${username} stopped typing in ${quizId}`);
      
      const room = quizId === 'global_chat' ? 'global_chat' : `quiz_${quizId}`;
      
      socket.to(room).emit('user_typing', {
        quizId: quizId,
        username: username,
        isTyping: false
      });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`🔴 User disconnected: ${socket.id} (${reason})`);
      
      // Remove from online users
      if (userId) {
        onlineUsers.delete(userId);
        
        setTimeout(async () => {
          try {
            const userSockets = await io.in(`user_${userId}`).fetchSockets();
            if (userSockets.length === 0) {
              await User.findByIdAndUpdate(userId, { 
                isOnline: false,
                lastSeen: new Date()
              });
              console.log(`👋 User ${user.username} marked as offline`);
            }
          } catch (error) {
            console.error('Error updating user offline status:', error);
          }
        }, 5000);
      }
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error);
    });

  }).catch(error => {
    clearTimeout(validationTimeout);
    console.error('❌ Error validating user:', error);
    socket.emit('authentication_error', { message: 'Error validating user' });
    socket.disconnect();
  });
});

// ==================== ERROR HANDLING ====================

// Error handling middleware
app.use(errorHandler);

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: {
      home: 'GET /',
      health: 'GET /health',
      status: 'GET /api/status',
      auth: ['POST /api/auth/register', 'POST /api/auth/login', 'POST /api/auth/logout', 'GET /api/auth/me'],
      quizzes: ['GET /api/quizzes', 'GET /api/quizzes/:id', 'POST /api/quizzes/:id/submit'],
      results: 'GET /api/results',
      users: ['GET /api/users/profile/:username', 'GET /api/users/leaderboard'],
      upload: 'POST /api/upload/profile-picture',
      chat: ['GET /api/chat/quiz/:quizId', 'DELETE /api/chat/message/:messageId'],
      conversations: 'GET /api/conversations'
    }
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🎯 King Ice Quiz Backend Server Started!');
  console.log('='.repeat(60));
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 Server running on port: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
  console.log(`🔗 MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
  console.log(`💬 Socket.IO: Enabled - Real-time chat ready`);
  console.log(`🛡️  Security: Enhanced protection enabled`);
  console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`);
  console.log(`🔒 Rate limiting: Enabled`);
  console.log(`🌐 CORS: Allowing Vercel and localhost`);
  console.log('='.repeat(60) + '\n');
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n📢 Received ${signal}. Starting graceful shutdown...`);
  
  httpServer.close((err) => {
    if (err) {
      console.error('Error closing HTTP server:', err);
      process.exit(1);
    }
    
    console.log('✅ HTTP server closed.');
    
    User.updateMany(
      { isOnline: true },
      { 
        isOnline: false,
        lastSeen: new Date()
      }
    ).then(() => {
      console.log('✅ All users marked as offline.');
    }).catch(err => {
      console.error('Error setting users offline:', err);
    }).finally(() => {
      mongoose.connection.close(false, () => {
        console.log('✅ MongoDB connection closed.');
        console.log('👋 Graceful shutdown completed.');
        process.exit(0);
      });
    });
  });
  
  setTimeout(() => {
    console.log('⚠️  Forcing shutdown after 30 seconds...');
    process.exit(1);
  }, 30000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (err, promise) => {
  console.log('❌ Unhandled Rejection at:', promise, 'reason:', err);
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  Continuing despite unhandled rejection...');
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  console.log('❌ Uncaught Exception thrown:', err);
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  Continuing despite uncaught exception...');
  } else {
    process.exit(1);
  }
});

mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose disconnected from MongoDB');
  if (process.env.NODE_ENV === 'production') {
    console.log('🔄 Attempting to reconnect to MongoDB...');
    setTimeout(connectDB, 5000);
  }
});

module.exports = app;