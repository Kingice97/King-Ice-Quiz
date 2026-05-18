const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'],
    index: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ],
    index: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    index: true
  },
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    picture: {
      type: String,
      default: null
    }
  },
  // NEW: Blocked users array for chat functionality
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isOnline: {
    type: Boolean,
    default: false,
    index: true
  },
  lastSeen: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  stats: {
    quizzesTaken: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    totalPoints: {
      type: Number,
      default: 0
    },
    totalCorrectAnswers: {
      type: Number,
      default: 0
    },
    totalQuestionsAttempted: {
      type: Number,
      default: 0
    },
    messagesSent: {
      type: Number,
      default: 0
    },
    chatParticipation: {
      type: Number,
      default: 0
    },
    bestScore: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,
      default: 0
    }
  },
  preferences: {
    showOnlineStatus: {
      type: Boolean,
      default: true
    },
    allowDirectMessages: {
      type: Boolean,
      default: true
    },
    chatNotifications: {
      type: Boolean,
      default: true
    },
    showResults: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastLogin: {
    type: Date,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// FIXED: Updated quiz stats method - COMPLETE FIX
userSchema.methods.updateQuizStats = function(correctCount, totalQuestions) {
  console.log(`🔄 Updating user stats - Correct: ${correctCount}, Total: ${totalQuestions}`);
  
  // Initialize stats if they don't exist
  if (!this.stats) {
    this.stats = {
      quizzesTaken: 0,
      averageScore: 0,
      totalPoints: 0,
      totalCorrectAnswers: 0,
      totalQuestionsAttempted: 0,
      messagesSent: 0,
      chatParticipation: 0,
      bestScore: 0,
      successRate: 0
    };
  }

  // Increment quizzes taken
  this.stats.quizzesTaken += 1;
  
  // Update total correct answers and total questions attempted
  this.stats.totalCorrectAnswers += correctCount;
  this.stats.totalQuestionsAttempted += totalQuestions;
  
  // Calculate average score based on correct answers percentage
  if (this.stats.totalQuestionsAttempted > 0) {
    this.stats.averageScore = (this.stats.totalCorrectAnswers / this.stats.totalQuestionsAttempted) * 100;
  }
  
  // Calculate current quiz score percentage
  const currentScorePercentage = (correctCount / totalQuestions) * 100;
  
  // Update best score if current is higher
  if (currentScorePercentage > this.stats.bestScore) {
    this.stats.bestScore = currentScorePercentage;
  }
  
  // Update success rate (percentage of quizzes where score >= 60%)
  const isPassed = currentScorePercentage >= 60;
  
  // Calculate success rate based on passed quizzes
  const previousQuizzes = this.stats.quizzesTaken - 1;
  const previousPassedQuizzes = Math.round((this.stats.successRate / 100) * Math.max(previousQuizzes, 0));
  const currentPassedQuizzes = previousPassedQuizzes + (isPassed ? 1 : 0);
  
  this.stats.successRate = (currentPassedQuizzes / this.stats.quizzesTaken) * 100;
  
  console.log(`✅ Updated user stats - Quizzes: ${this.stats.quizzesTaken}, Avg: ${this.stats.averageScore.toFixed(2)}%, Best: ${this.stats.bestScore.toFixed(2)}%, Success: ${this.stats.successRate.toFixed(2)}%`);
  
  this.lastActivity = new Date();
  this.markModified('stats');
};

// NEW: Update stats method for backward compatibility
userSchema.methods.updateStats = function(score, totalQuestions) {
  this.updateQuizStats(score, totalQuestions);
};

// NEW: Increment message count
userSchema.methods.incrementMessageCount = function() {
  if (!this.stats) {
    this.stats = {
      quizzesTaken: 0,
      averageScore: 0,
      totalPoints: 0,
      totalCorrectAnswers: 0,
      totalQuestionsAttempted: 0,
      messagesSent: 0,
      chatParticipation: 0,
      bestScore: 0,
      successRate: 0
    };
  }
  this.stats.messagesSent += 1;
  this.stats.chatParticipation = Math.max(1, this.stats.chatParticipation);
  this.lastActivity = new Date();
  this.markModified('stats');
};

// NEW: Update online status methods
userSchema.methods.setOnline = function() {
  this.isOnline = true;
  this.lastSeen = new Date();
  this.lastActivity = new Date();
};

userSchema.methods.setOffline = function() {
  this.isOnline = false;
  this.lastSeen = new Date();
};

// NEW: Update user activity
userSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  if (!this.isOnline) {
    this.isOnline = true;
  }
};

// NEW: Get user profile for chat
userSchema.methods.getChatProfile = function() {
  return {
    _id: this._id,
    username: this.username,
    profilePicture: this.profile.picture || this.profile.avatar,
    isOnline: this.isOnline,
    lastSeen: this.lastSeen,
    lastActivity: this.lastActivity,
    role: this.role,
    preferences: this.preferences
  };
};

// NEW: Update profile picture
userSchema.methods.updateProfilePicture = function(imagePath) {
  this.profile.picture = imagePath;
  if (this.profile) {
    this.profile.avatar = imagePath;
  }
  this.updatedAt = new Date();
};

// NEW: Get public profile (for other users)
userSchema.methods.getPublicProfile = function() {
  return {
    _id: this._id,
    username: this.username,
    profile: {
      firstName: this.profile.firstName,
      lastName: this.profile.lastName,
      picture: this.profile.picture,
      bio: this.profile.bio
    },
    stats: {
      quizzesTaken: this.stats.quizzesTaken,
      averageScore: Math.round(this.stats.averageScore),
      bestScore: Math.round(this.stats.bestScore),
      successRate: Math.round(this.stats.successRate),
      messagesSent: this.stats.messagesSent,
      chatParticipation: this.stats.chatParticipation
    },
    isOnline: this.preferences.showOnlineStatus ? this.isOnline : undefined,
    lastSeen: this.preferences.showOnlineStatus ? this.lastSeen : undefined,
    role: this.role,
    createdAt: this.createdAt
  };
};

// NEW: Check if user is blocked
userSchema.methods.isBlocked = function(userId) {
  return this.blockedUsers && this.blockedUsers.includes(userId);
};

// NEW: Block a user
userSchema.methods.blockUser = function(userId) {
  if (!this.blockedUsers) {
    this.blockedUsers = [];
  }
  if (!this.blockedUsers.includes(userId)) {
    this.blockedUsers.push(userId);
    this.markModified('blockedUsers');
  }
};

// NEW: Unblock a user
userSchema.methods.unblockUser = function(userId) {
  if (this.blockedUsers) {
    this.blockedUsers = this.blockedUsers.filter(id => id.toString() !== userId.toString());
    this.markModified('blockedUsers');
  }
};

// NEW: Get blocked users list (for admin/management)
userSchema.methods.getBlockedUsers = function() {
  return this.blockedUsers || [];
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.username;
});

// NEW: Virtual for display name (username with @)
userSchema.virtual('displayName').get(function() {
  return `@${this.username}`;
});

// NEW: Virtual for chat availability
userSchema.virtual('isAvailableForChat').get(function() {
  return this.isActive && 
         this.isOnline && 
         this.preferences.allowDirectMessages &&
         this.preferences.showOnlineStatus;
});

// NEW: Virtual for profile picture URL
userSchema.virtual('profilePictureUrl').get(function() {
  if (!this.profile.picture) return null;
  
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  if (this.profile.picture.startsWith('http')) {
    return this.profile.picture;
  }
  return `${baseUrl}${this.profile.picture}`;
});

// NEW: Virtual for blocked users count
userSchema.virtual('blockedUsersCount').get(function() {
  return this.blockedUsers ? this.blockedUsers.length : 0;
});

// Transform output to remove password and add virtuals
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
    
    // Add profile picture URL to response
    if (ret.profile && ret.profile.picture) {
      ret.profilePictureUrl = doc.profilePictureUrl;
    }
    
    // Don't expose blocked users list in normal responses for privacy
    if (ret.blockedUsers) {
      ret.blockedUsersCount = doc.blockedUsersCount;
      // Only show blockedUsers array in specific contexts (like admin views)
      if (!ret.showBlockedList) {
        delete ret.blockedUsers;
      }
    }
    
    return ret;
  }
});

// Compound indexes for common query patterns
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ 'stats.quizzesTaken': -1, 'stats.averageScore': -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1, isActive: 1 });
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ username: 1, isActive: 1 });

// NEW: Indexes for chat features
userSchema.index({ isOnline: 1, lastActivity: -1 });
userSchema.index({ username: 'text', 'profile.firstName': 'text', 'profile.lastName': 'text' });

// NEW: Compound index for chat user lookup
userSchema.index({ 
  username: 1, 
  isActive: 1, 
  isOnline: 1,
  'preferences.allowDirectMessages': 1,
  'preferences.showOnlineStatus': 1
});

// NEW: Index for blocked users functionality
userSchema.index({ blockedUsers: 1 });

// Text index for search functionality
userSchema.index({
  'username': 'text',
  'email': 'text',
  'profile.firstName': 'text',
  'profile.lastName': 'text'
});

// NEW: Index for activity tracking
userSchema.index({ lastActivity: -1 });
userSchema.index({ lastSeen: -1 });

module.exports = mongoose.model('User', userSchema);