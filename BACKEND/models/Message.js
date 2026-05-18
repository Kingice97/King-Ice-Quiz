const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: false,
    default: null
  },
  room: {
    type: String,
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  profilePicture: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['text', 'system', 'global', 'private'],
    default: 'text'
  },
  // NEW: Fields for private messages
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: false,
    index: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isDelivered: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
messageSchema.index({ room: 1, timestamp: 1 });
messageSchema.index({ quiz: 1, timestamp: 1 });
messageSchema.index({ user: 1 });
messageSchema.index({ timestamp: -1 });
messageSchema.index({ type: 1 });
messageSchema.index({ recipient: 1, isRead: 1 });
messageSchema.index({ recipient: 1, isDelivered: 1 });
messageSchema.index({ user: 1, recipient: 1, timestamp: -1 });
// NEW: Index for conversation
messageSchema.index({ conversation: 1, timestamp: 1 });

module.exports = mongoose.model('Message', messageSchema);