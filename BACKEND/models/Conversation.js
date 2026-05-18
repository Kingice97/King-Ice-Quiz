const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ 'unreadCount.userId': 1 });

// Static method to find or create conversation
conversationSchema.statics.findOrCreate = async function(participantIds) {
  const sortedIds = participantIds.sort();
  let conversation = await this.findOne({
    participants: { $all: sortedIds, $size: sortedIds.length }
  }).populate('participants', 'username profile isOnline lastSeen')
    .populate('lastMessage');

  if (!conversation) {
    conversation = await this.create({
      participants: sortedIds
    });
    conversation = await this.findById(conversation._id)
      .populate('participants', 'username profile isOnline lastSeen')
      .populate('lastMessage');
  }

  return conversation;
};

// Method to get other participant
conversationSchema.methods.getOtherParticipant = function(currentUserId) {
  return this.participants.find(participant => 
    participant._id.toString() !== currentUserId.toString()
  );
};

// Method to increment unread count
conversationSchema.methods.incrementUnreadCount = function(userId) {
  const currentCount = this.unreadCount.get(userId.toString()) || 0;
  this.unreadCount.set(userId.toString(), currentCount + 1);
};

// Method to reset unread count
conversationSchema.methods.resetUnreadCount = function(userId) {
  this.unreadCount.set(userId.toString(), 0);
};

module.exports = mongoose.model('Conversation', conversationSchema);