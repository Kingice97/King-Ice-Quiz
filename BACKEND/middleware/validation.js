const { validationResult, body, param } = require('express-validator');

// Middleware to check for validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

// Custom validation rules
exports.validationRules = {
  register: [
    body('username')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers and underscores'),
    
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    
    body('role')
      .optional()
      .isIn(['user', 'admin'])
      .withMessage('Role must be either user or admin')
  ],
  
  login: [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  
  // NEW: Password change validation
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
      .custom((value, { req }) => {
        if (value === req.body.currentPassword) {
          throw new Error('New password must be different from current password');
        }
        return true;
      })
  ],
  
  // NEW: Profile update validation
  updateProfile: [
    body('username')
      .optional()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers and underscores'),
    
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    body('profile.bio')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Bio must be less than 500 characters'),
    
    body('profile.location')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Location must be less than 100 characters')
  ],
  
  // NEW: ID parameter validation
  idParam: [
    param('id')
      .isMongoId()
      .withMessage('Invalid ID format')
  ],
  
  createQuiz: [
    body('title')
      .isLength({ min: 1, max: 100 })
      .withMessage('Title must be between 1 and 100 characters')
      .trim(),
    
    body('description')
      .isLength({ min: 1, max: 500 })
      .withMessage('Description must be between 1 and 500 characters')
      .trim(),
    
    body('category')
      .isLength({ min: 1, max: 50 })
      .withMessage('Category must be between 1 and 50 characters')
      .trim(),
    
    body('difficulty')
      .isIn(['Easy', 'Medium', 'Hard'])
      .withMessage('Difficulty must be Easy, Medium, or Hard'),
    
    body('timeLimit')
      .isInt({ min: 1, max: 180 })
      .withMessage('Time limit must be between 1 and 180 minutes'),
    
    body('questions')
      .isArray({ min: 1 })
      .withMessage('Quiz must have at least one question'),
    
    body('questions.*.questionText')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Question text must be between 1 and 1000 characters'),
    
    body('questions.*.options')
      .isArray({ min: 2, max: 6 })
      .withMessage('Each question must have between 2 and 6 options'),
    
    body('questions.*.correctAnswer')
      .isInt({ min: 0 })
      .withMessage('Correct answer must be a valid option index')
  ]

};