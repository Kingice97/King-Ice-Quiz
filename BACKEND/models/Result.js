const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionIndex: {
    type: Number,
    required: true,
    min: 0
  },
  selectedAnswer: {
    type: Number,
    required: true,
    min: 0
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  }
});

const resultSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  totalQuestions: {
    type: Number,
    required: true,
    min: 1
  },
  totalPoints: {
    type: Number,
    required: true,
    min: 0
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  answers: [answerSchema],
  timeTaken: {
    type: Number, // in seconds
    required: true,
    min: 0
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  attemptNumber: {
    type: Number,
    default: 1
  },
  passed: {
    type: Boolean,
    required: true
  },
  rank: Number,
  timePerQuestion: {
    type: Number, // average time in seconds
    default: 0
  }
});

// Calculate percentage and passed status before saving
resultSchema.pre('save', function(next) {
  this.percentage = (this.score / this.totalQuestions) * 100;
  this.passed = this.percentage >= 60; // Using 60% as passing threshold
  this.timePerQuestion = this.timeTaken / this.totalQuestions;
  next();
});

// Index for better query performance
resultSchema.index({ userId: 1, quizId: 1 });
resultSchema.index({ quizId: 1, percentage: -1 });
resultSchema.index({ completedAt: -1 });
resultSchema.index({ userId: 1, completedAt: -1 });

// Static method to get user's best result for a quiz
resultSchema.statics.getBestResult = function(userId, quizId) {
  return this.findOne({ userId, quizId })
    .sort({ percentage: -1, timeTaken: 1 })
    .limit(1);
};

// Static method to get quiz leaderboard
resultSchema.statics.getLeaderboard = function(quizId, limit = 10) {
  return this.find({ quizId })
    .sort({ percentage: -1, timeTaken: 1 })
    .limit(limit)
    .populate('userId', 'username profile');
};

// Method to calculate rank
resultSchema.methods.calculateRank = async function() {
  const betterResults = await this.constructor.countDocuments({
    quizId: this.quizId,
    $or: [
      { percentage: { $gt: this.percentage } },
      { percentage: this.percentage, timeTaken: { $lt: this.timeTaken } }
    ]
  });
  
  this.rank = betterResults + 1;
  return this.rank;
};

// Transform output
resultSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Result', resultSchema);