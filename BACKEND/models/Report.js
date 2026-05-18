const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reportedMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  reportedChat: {
    type: String
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['user', 'message', 'chat'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  actionTaken: {
    type: String,
    trim: true
  }
});

module.exports = mongoose.model('Report', reportSchema);