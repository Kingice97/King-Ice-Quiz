const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Please provide question text'],
    trim: true,
    maxlength: [1000, 'Question text cannot exceed 1000 characters']
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: function(options) {
        return options.length >= 2 && options.length <= 6;
      },
      message: 'A question must have between 2 and 6 options'
    }
  },
  correctAnswer: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(value) {
        return value < this.options.length;
      },
      message: 'Correct answer must be a valid option index'
    }
  },
  explanation: {
    type: String,
    maxlength: [500, 'Explanation cannot exceed 500 characters']
  },
  points: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  }
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a quiz title'],
    trim: true,
    maxlength: [100, 'Quiz title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  questions: [questionSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timeLimit: {
    type: Number,
    default: 10,
    min: [1, 'Time limit must be at least 1 minute'],
    max: [180, 'Time limit cannot exceed 180 minutes']
  },
  maxAttempts: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  // NEW: Quiz access code system
  accessCode: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true,
    minlength: [6, 'Access code must be at least 6 characters'],
    maxlength: [20, 'Access code cannot exceed 20 characters']
  },
  requiresCode: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: null
  },
  autoExpire: {
    type: Boolean,
    default: false
  },
  expireAfterHours: {
    type: Number,
    default: 24,
    min: 1,
    max: 720
  },
  tags: [String],
  passingScore: {
    type: Number,
    default: 60,
    min: 0,
    max: 100
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  stats: {
    timesTaken: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    averageTime: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate total points before saving
quizSchema.pre('save', function(next) {
  this.totalPoints = this.questions.reduce((total, question) => total + question.points, 0);
  this.updatedAt = Date.now();
  
  if (this.autoExpire && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + (this.expireAfterHours * 60 * 60 * 1000));
  }
  
  next();
});

// Virtual for checking if quiz is expired
quizSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

// Virtual for checking if quiz is available (active and not expired)
quizSchema.virtual('isAvailable').get(function() {
  return this.isActive && !this.isExpired;
});

// Update stats method
quizSchema.methods.updateStats = function(newScore, timeTaken) {
  this.stats.timesTaken += 1;
  this.stats.averageScore = ((this.stats.averageScore * (this.stats.timesTaken - 1)) + newScore) / this.stats.timesTaken;
  this.stats.averageTime = ((this.stats.averageTime * (this.stats.timesTaken - 1)) + timeTaken) / this.stats.timesTaken;
};

// Method to manually close quiz
quizSchema.methods.closeQuiz = function() {
  this.isActive = false;
  this.expiresAt = new Date();
};

// Method to open quiz
quizSchema.methods.openQuiz = function() {
  this.isActive = true;
  this.expiresAt = null;
  this.autoExpire = false;
};

// Method to set auto-expiration
quizSchema.methods.setAutoExpire = function(hours) {
  this.autoExpire = true;
  this.expireAfterHours = hours;
  this.expiresAt = new Date(Date.now() + (hours * 60 * 60 * 1000));
};

// Index for better query performance
quizSchema.index({ category: 1, difficulty: 1 });
quizSchema.index({ createdBy: 1 });
quizSchema.index({ isActive: 1, isPublic: 1 });
quizSchema.index({ expiresAt: 1 });
quizSchema.index({ isActive: 1, expiresAt: 1 });
quizSchema.index({ accessCode: 1 }); // NEW: Index for access code lookup

// Transform output - include virtuals
quizSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Quiz', quizSchema);