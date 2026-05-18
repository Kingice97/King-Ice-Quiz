const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Please provide question text'],
    trim: true,
    maxlength: [1000, 'Question text cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'text'],
    default: 'multiple-choice'
  },
  options: {
    type: [String],
    validate: {
      validator: function(options) {
        if (this.type === 'multiple-choice') {
          return options && options.length >= 2 && options.length <= 6;
        }
        return true;
      },
      message: 'Multiple choice questions must have between 2 and 6 options'
    }
  },
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed,
    required: true
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
  tags: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
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

// Validate correctAnswer based on question type
questionSchema.pre('validate', function(next) {
  if (this.type === 'multiple-choice') {
    if (typeof this.correctAnswer !== 'number' || this.correctAnswer < 0 || this.correctAnswer >= this.options.length) {
      return next(new Error('Correct answer must be a valid option index for multiple choice questions'));
    }
  } else if (this.type === 'true-false') {
    if (typeof this.correctAnswer !== 'boolean') {
      return next(new Error('Correct answer must be boolean for true/false questions'));
    }
  }
  next();
});

// Update the updatedAt field before saving
questionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
questionSchema.index({ category: 1, difficulty: 1 });
questionSchema.index({ createdBy: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ isActive: 1 });

module.exports = mongoose.model('Question', questionSchema);