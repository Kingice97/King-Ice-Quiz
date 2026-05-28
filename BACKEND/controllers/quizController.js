const Quiz = require('../models/Quiz');
const Result = require('../models/Result');
const User = require('../models/User');

// @desc    Get all quizzes
// @route   GET /api/quizzes
// @access  Public
exports.getQuizzes = async (req, res, next) => {
  try {
    const {
      category,
      difficulty,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    console.log('🔍 Received search params:', { category, difficulty, search });

    // Build filter array for $and
    const filterConditions = [];

    // Always include these conditions
    filterConditions.push({ isActive: true });
    filterConditions.push({ isPublic: true });
    filterConditions.push({
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    });

    // NEW: Hide code-protected quizzes from public listing
    // Users must use the /join-by-code endpoint to access these
    filterConditions.push({
      $or: [
        { requiresCode: { $ne: true } },
        { requiresCode: { $exists: false } },
        { accessCode: null },
        { accessCode: { $exists: false } }
      ]
    });

    // Add category filter if provided
    if (category && category.trim()) {
      filterConditions.push({ category: new RegExp(category, 'i') });
    }

    // Add difficulty filter if provided
    if (difficulty && difficulty.trim()) {
      filterConditions.push({ difficulty: difficulty });
    }

    // Add search filter if provided
    if (search && search.trim()) {
      filterConditions.push({
        $or: [
          { title: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') },
          { category: new RegExp(search, 'i') }
        ]
      });
    }

    // Create final filter
    const filter = filterConditions.length > 0 ? { $and: filterConditions } : {};

    console.log('🔍 Final MongoDB filter:', JSON.stringify(filter, null, 2));

    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const quizzes = await Quiz.find(filter)
      .select('title description category difficulty timeLimit questions stats totalPoints createdBy createdAt expiresAt autoExpire requiresCode')
      .populate('createdBy', 'username profile')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Quiz.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    console.log('🔍 Found quizzes:', quizzes.length);
    console.log('🔍 Quiz titles:', quizzes.map(q => q.title));

    res.json({
      success: true,
      count: quizzes.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      },
      data: quizzes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single quiz
// @route   GET /api/quizzes/:id
// @access  Public
exports.getQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('createdBy', 'username profile');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // UPDATED: Check if quiz is available (active and not expired)
    const isExpired = quiz.expiresAt && new Date() > quiz.expiresAt;
    if (!quiz.isActive || isExpired) {
      return res.status(404).json({
        success: false,
        message: 'Quiz is not available'
      });
    }

    // For non-admin users, don't send correct answers
    const quizObj = quiz.toObject();
    if (!req.user || req.user.role !== 'admin') {
      quizObj.questions = quizObj.questions.map(q => {
        const { correctAnswer, ...questionWithoutAnswer } = q;
        return questionWithoutAnswer;
      });
    }

    res.json({
      success: true,
      data: quizObj
    });
  } catch (error) {
    next(error);
  }
};

// NEW: Get quiz WITH correct answers for local scoring
// @desc    Get quiz with correct answers (for local scoring)
// @route   GET /api/quizzes/:id/with-answers
// @access  Private
exports.getQuizWithAnswers = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('createdBy', 'username profile');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // UPDATED: Check if quiz is available (active and not expired)
    const isExpired = quiz.expiresAt && new Date() > quiz.expiresAt;
    if (!quiz.isActive || isExpired) {
      return res.status(404).json({
        success: false,
        message: 'Quiz is not available'
      });
    }

    // Send quiz WITH correct answers for authenticated users
    // This allows local score calculation when backend submission fails
    res.json({
      success: true,
      data: quiz
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create quiz
// @route   POST /api/quizzes
// @access  Private/Admin
exports.createQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.create({
      ...req.body,
      createdBy: req.user.id
    });

    const populatedQuiz = await Quiz.findById(quiz._id)
      .populate('createdBy', 'username profile');

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: populatedQuiz
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update quiz
// @route   PUT /api/quizzes/:id
// @access  Private/Admin
exports.updateQuiz = async (req, res, next) => {
  try {
    let quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check if user owns the quiz or is admin
    if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this quiz'
      });
    }

    quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username profile');

    res.json({
      success: true,
      message: 'Quiz updated successfully',
      data: quiz
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Private/Admin
exports.deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check if user owns the quiz or is admin
    if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this quiz'
      });
    }

    await Quiz.findByIdAndDelete(req.params.id);

    // Also delete related results
    await Result.deleteMany({ quizId: req.params.id });

    res.json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit quiz results
// @route   POST /api/quizzes/:id/submit
// @access  Private
exports.submitQuiz = async (req, res, next) => {
  try {
    const { answers, timeTaken } = req.body;
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // UPDATED: Check if quiz is available (active and not expired)
    const isExpired = quiz.expiresAt && new Date() > quiz.expiresAt;
    if (!quiz.isActive || isExpired) {
      return res.status(400).json({
        success: false,
        message: 'This quiz is no longer available'
      });
    }

    // Check max attempts - FIXED: Set maxAttempts to 1 to prevent retakes
    const maxAttempts = quiz.maxAttempts || 1; // Default to 1 attempt if not set
    if (maxAttempts > 0) {
      const previousAttempts = await Result.countDocuments({
        userId: req.user.id,
        quizId: quiz._id
      });
      
      if (previousAttempts >= maxAttempts) {
        return res.status(400).json({
          success: false,
          message: `Maximum attempts (${maxAttempts}) exceeded for this quiz. You cannot retake this quiz.`
        });
      }
    }

    // Calculate score and detailed results - FIXED SCORING LOGIC
    let score = 0;
    let totalPoints = 0;
    let correctCount = 0;
    
    const answerDetails = answers.map((answer, index) => {
      const question = quiz.questions[index];
      const isCorrect = answer.selectedAnswer === question.correctAnswer;
      
      if (isCorrect) {
        score += question.points;
        correctCount += 1; // Count correct answers
      }
      
      totalPoints += question.points;
      
      return {
        questionIndex: index,
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
        timeSpent: answer.timeSpent || 0
      };
    });

    // FIXED: Calculate percentage based on correct answers count, not points
    const percentage = (correctCount / quiz.questions.length) * 100;

    // Get attempt number
    const attemptNumber = await Result.countDocuments({
      userId: req.user.id,
      quizId: quiz._id
    }) + 1;

    // Save result
    const result = await Result.create({
      quizId: quiz._id,
      userId: req.user.id,
      userName: req.user.username,
      score: correctCount, // Use correctCount as score instead of points
      totalQuestions: quiz.questions.length,
      totalPoints: quiz.questions.length, // Each question is worth 1 point for counting
      percentage,
      answers: answerDetails,
      timeTaken,
      attemptNumber,
      passed: percentage >= (quiz.passingScore || 60) // Default to 60% if not set
    });

    // Calculate rank
    await result.calculateRank();
    await result.save();

    // Update quiz stats
    quiz.updateStats(percentage, timeTaken);
    await quiz.save();

   // FIXED: Update user stats with proper implementation
try {
  const user = await User.findById(req.user.id);
  if (user) {
    console.log(`🔄 Updating user stats for: ${user.username}`);
    console.log(`📊 Quiz result - Correct: ${correctCount}, Total: ${quiz.questions.length}`);
    
    // Use the updated method from User model
    user.updateQuizStats(correctCount, quiz.questions.length);
    await user.save();
    
    console.log(`✅ User stats updated successfully`);
    console.log(`📈 New stats - Quizzes: ${user.stats.quizzesTaken}, Avg: ${user.stats.averageScore}%`);
  } else {
    console.log('⚠️ User not found for stats update');
  }
} catch (userError) {
  console.error('⚠️ User stats update failed, but continuing:', userError);
  // Don't fail the entire request if user stats update fails
}

    // Get the saved result with populated data
    const populatedResult = await Result.findById(result._id)
      .populate('quizId', 'title category difficulty')
      .populate('userId', 'username profile');

    res.json({
      success: true,
      message: 'Quiz submitted successfully',
      data: {
        result: populatedResult,
        summary: {
          score: correctCount, // Send correct count as score
          totalQuestions: quiz.questions.length,
          totalPoints: quiz.questions.length,
          percentage: Math.round(percentage * 100) / 100,
          timeTaken,
          passed: percentage >= (quiz.passingScore || 60),
          attemptNumber,
          answers: answerDetails // Include answers in summary for frontend
        }
      }
    });
  } catch (error) {
    console.error('❌ Quiz submission error:', error);
    next(error);
  }
};

// @desc    Get quiz results (Admin only) - FIXED: Admin data isolation
// @route   GET /api/quizzes/:id/results
// @access  Private/Admin
exports.getQuizResults = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // FIXED: Check if admin owns this quiz
    if (quiz.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view results for this quiz'
      });
    }

    const results = await Result.find({ quizId: req.params.id })
      .populate('userId', 'username profile')
      .sort({ percentage: -1, timeTaken: 1 });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all quizzes for admin dashboard - NEW: Admin-specific quizzes
// @route   GET /api/quizzes/admin/my-quizzes
// @access  Private/Admin
exports.getAdminQuizzes = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // FIXED: Only show quizzes created by this admin
    const filter = { createdBy: req.user.id };

    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const quizzes = await Quiz.find(filter)
      .select('title description category difficulty timeLimit questions stats totalPoints createdBy createdAt expiresAt autoExpire isActive isPublic accessCode requiresCode')
      .populate('createdBy', 'username profile')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Quiz.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      count: quizzes.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      },
      data: quizzes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all results for admin dashboard - NEW: Admin-specific results
// @route   GET /api/quizzes/admin/my-results
// @access  Private/Admin
exports.getAdminResults = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // FIXED: Only show results for quizzes created by this admin
    const adminQuizzes = await Quiz.find({ createdBy: req.user.id }).select('_id');
    const adminQuizIds = adminQuizzes.map(quiz => quiz._id);

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const results = await Result.find({ quizId: { $in: adminQuizIds } })
      .populate('userId', 'username profile')
      .populate('quizId', 'title category difficulty')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Result.countDocuments({ quizId: { $in: adminQuizIds } });
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      count: results.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      },
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get quiz leaderboard
// @route   GET /api/quizzes/:id/leaderboard
// @access  Public
exports.getQuizLeaderboard = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    const leaderboard = await Result.getLeaderboard(req.params.id, parseInt(limit));

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Close quiz (Admin only)
// @route   PUT /api/quizzes/:id/close
// @access  Private/Admin
exports.closeQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check if user owns the quiz or is admin
    if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage this quiz'
      });
    }

    quiz.closeQuiz();
    await quiz.save();

    res.json({
      success: true,
      message: 'Quiz closed successfully',
      data: quiz
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Open quiz (Admin only)
// @route   PUT /api/quizzes/:id/open
// @access  Private/Admin
exports.openQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check if user owns the quiz or is admin
    if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage this quiz'
      });
    }

    quiz.openQuiz();
    await quiz.save();

    res.json({
      success: true,
      message: 'Quiz opened successfully',
      data: quiz
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set quiz expiration (Admin only)
// @route   PUT /api/quizzes/:id/expire
// @access  Private/Admin
exports.setQuizExpiration = async (req, res, next) => {
  try {
    const { hours } = req.body;
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check if user owns the quiz or is admin
    if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage this quiz'
      });
    }

    quiz.setAutoExpire(hours);
    await quiz.save();

    res.json({
      success: true,
      message: `Quiz will expire in ${hours} hours`,
      data: quiz
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate unique access code
// @route   POST /api/quizzes/:id/generate-code
// @access  Private/Admin
exports.generateAccessCode = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check if user owns the quiz or is admin
    if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage this quiz'
      });
    }

    // If code already exists, just return it - don't generate a new one
    if (quiz.accessCode) {
      return res.json({
        success: true,
        message: 'Access code already exists',
        data: {
          accessCode: quiz.accessCode,
          quizId: quiz._id,
          quizTitle: quiz.title
        }
      });
    }

    // Generate unique 8-character alphanumeric code
    const generateCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing 0/O, 1/I
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let code;
    let isUnique = false;
    let attempts = 0;

    // Ensure unique code
    while (!isUnique && attempts < 10) {
      code = generateCode();
      const existing = await Quiz.findOne({ accessCode: code });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate unique code. Please try again.'
      });
    }

    quiz.accessCode = code;
    quiz.requiresCode = true;
    await quiz.save();

    res.json({
      success: true,
      message: 'Access code generated successfully',
      data: {
        accessCode: code,
        quizId: quiz._id,
        quizTitle: quiz.title
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join quiz by access code
// @route   POST /api/quizzes/join-by-code
// @access  Private
exports.joinByCode = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an access code'
      });
    }

    const cleanCode = code.trim().toUpperCase();

    // Find quiz by access code
    const quiz = await Quiz.findOne({ 
      accessCode: cleanCode,
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    }).select('title description category difficulty timeLimit questions stats totalPoints createdAt expiresAt accessCode');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired access code. Please check the code and try again.'
      });
    }

    // Don't send correct answers
    const quizObj = quiz.toObject();
    quizObj.questions = quizObj.questions.map(q => {
      const { correctAnswer, ...questionWithoutAnswer } = q;
      return questionWithoutAnswer;
    });

    res.json({
      success: true,
      message: 'Quiz found!',
      data: quizObj
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get results by access code (for admin tracking)
// @route   GET /api/quizzes/code/:code/results
// @access  Private/Admin
exports.getResultsByCode = async (req, res, next) => {
  try {
    const { code } = req.params;

    const quiz = await Quiz.findOne({ accessCode: code.toUpperCase() });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'No quiz found with this access code'
      });
    }

    // Check if admin owns this quiz
    if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these results'
      });
    }

    const results = await Result.find({ quizId: quiz._id })
      .populate('userId', 'username profile email')
      .sort({ percentage: -1, timeTaken: 1 });

    res.json({
      success: true,
      code: code,
      quizTitle: quiz.title,
      count: results.length,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove access code from quiz
// @route   DELETE /api/quizzes/:id/access-code
// @access  Private/Admin
exports.removeAccessCode = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage this quiz'
      });
    }

    quiz.accessCode = undefined;
    quiz.requiresCode = false;
    await quiz.save();

    res.json({
      success: true,
      message: 'Access code removed successfully',
      data: quiz
    });
  } catch (error) {
    next(error);
  }
};