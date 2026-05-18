const Result = require('../models/Result');
const Quiz = require('../models/Quiz');
const User = require('../models/User');

// @desc    Get user's quiz results
// @route   GET /api/results
// @access  Private
exports.getUserResults = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'completedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = { userId: req.user.id };

    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const results = await Result.find(filter)
      .populate('quizId', 'title category difficulty')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Result.countDocuments(filter);
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

// @desc    Get all results for admin's quizzes only (Admin only)
// @route   GET /api/results/admin/all
// @access  Private/Admin
exports.getAllResults = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 100,
      sortBy = 'completedAt',
      sortOrder = 'desc'
    } = req.query;

    // Get all quizzes created by this admin
    const adminQuizzes = await Quiz.find({ createdBy: req.user.id }).select('_id');
    const adminQuizIds = adminQuizzes.map(quiz => quiz._id);

    // Get all regular user IDs (exclude admins)
    const regularUsers = await User.find({ role: 'user' }).select('_id');
    const regularUserIds = regularUsers.map(user => user._id);

    // Filter to only include results from regular users AND admin's quizzes
    const filter = { 
      userId: { $in: regularUserIds },
      quizId: { $in: adminQuizIds }
    };

    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const results = await Result.find(filter)
      .populate('quizId', 'title category difficulty createdBy')
      .populate('userId', 'username profile role')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Result.countDocuments(filter);

    res.json({
      success: true,
      count: results.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      },
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single result
// @route   GET /api/results/:id
// @access  Private
exports.getResult = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('quizId')
      .populate('userId', 'username profile');

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    // Check if user owns the result or is admin
    if (result.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this result'
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's results for a specific quiz
// @route   GET /api/results/quiz/:quizId
// @access  Private
exports.getQuizResults = async (req, res, next) => {
  try {
    const results = await Result.find({
      userId: req.user.id,
      quizId: req.params.quizId
    })
    .populate('quizId', 'title category difficulty')
    .sort({ completedAt: -1 });

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get quiz results for admin's quiz only (Admin only)
// @route   GET /api/results/admin/quiz/:quizId
// @access  Private/Admin
exports.getQuizResultsAdmin = async (req, res, next) => {
  try {
    // Check if the quiz belongs to this admin
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    if (quiz.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access results for this quiz'
      });
    }

    // Get all regular user IDs (exclude admins)
    const regularUsers = await User.find({ role: 'user' }).select('_id');
    const regularUserIds = regularUsers.map(user => user._id);

    const results = await Result.find({
      userId: { $in: regularUserIds },
      quizId: req.params.quizId
    })
    .populate('quizId', 'title category difficulty createdBy')
    .populate('userId', 'username profile role')
    .sort({ completedAt: -1 });

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's best result for a quiz
// @route   GET /api/results/quiz/:quizId/best
// @access  Private
exports.getBestResult = async (req, res, next) => {
  try {
    const bestResult = await Result.getBestResult(req.user.id, req.params.quizId);

    if (!bestResult) {
      return res.status(404).json({
        success: false,
        message: 'No results found for this quiz'
      });
    }

    await bestResult.populate('quizId', 'title category difficulty passingScore');

    res.json({
      success: true,
      data: bestResult
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user statistics
// @route   GET /api/results/stats
// @access  Private
exports.getUserStats = async (req, res, next) => {
  try {
    const stats = await Result.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: null,
          totalQuizzesTaken: { $sum: 1 },
          averageScore: { $avg: '$percentage' },
          bestScore: { $max: '$percentage' },
          totalTimeSpent: { $sum: '$timeTaken' },
          passedQuizzes: {
            $sum: { $cond: ['$passed', 1, 0] }
          }
        }
      }
    ]);

    const categoryStats = await Result.aggregate([
      { $match: { userId: req.user._id } },
      {
        $lookup: {
          from: 'quizzes',
          localField: 'quizId',
          foreignField: '_id',
          as: 'quiz'
        }
      },
      { $unwind: '$quiz' },
      {
        $group: {
          _id: '$quiz.category',
          averageScore: { $avg: '$percentage' },
          quizzesTaken: { $sum: 1 },
          bestScore: { $max: '$percentage' }
        }
      },
      { $sort: { averageScore: -1 } }
    ]);

    const defaultStats = {
      totalQuizzesTaken: 0,
      averageScore: 0,
      bestScore: 0,
      totalTimeSpent: 0,
      passedQuizzes: 0,
      successRate: 0
    };

    const userStats = stats.length > 0 ? stats[0] : defaultStats;
    userStats.successRate = userStats.totalQuizzesTaken > 0 
      ? (userStats.passedQuizzes / userStats.totalQuizzesTaken) * 100 
      : 0;

    res.json({
      success: true,
      data: {
        overall: userStats,
        byCategory: categoryStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin's platform statistics (Admin only)
// @route   GET /api/results/admin/stats
// @access  Private/Admin
exports.getPlatformStats = async (req, res, next) => {
  try {
    // Get all quizzes created by this admin
    const adminQuizzes = await Quiz.find({ createdBy: req.user.id }).select('_id');
    const adminQuizIds = adminQuizzes.map(quiz => quiz._id);

    // Get all regular user IDs (exclude admins)
    const regularUsers = await User.find({ role: 'user' }).select('_id');
    const regularUserIds = regularUsers.map(user => user._id);

    const stats = await Result.aggregate([
      { 
        $match: { 
          userId: { $in: regularUserIds },
          quizId: { $in: adminQuizIds }
        } 
      },
      {
        $group: {
          _id: null,
          totalQuizzesTaken: { $sum: 1 },
          averageScore: { $avg: '$percentage' },
          bestScore: { $max: '$percentage' },
          totalTimeSpent: { $sum: '$timeTaken' },
          passedQuizzes: {
            $sum: { $cond: ['$passed', 1, 0] }
          }
        }
      }
    ]);

    const categoryStats = await Result.aggregate([
      { 
        $match: { 
          userId: { $in: regularUserIds },
          quizId: { $in: adminQuizIds }
        } 
      },
      {
        $lookup: {
          from: 'quizzes',
          localField: 'quizId',
          foreignField: '_id',
          as: 'quiz'
        }
      },
      { $unwind: '$quiz' },
      {
        $group: {
          _id: '$quiz.category',
          averageScore: { $avg: '$percentage' },
          quizzesTaken: { $sum: 1 },
          bestScore: { $max: '$percentage' }
        }
      },
      { $sort: { averageScore: -1 } }
    ]);

    const defaultStats = {
      totalQuizzesTaken: 0,
      averageScore: 0,
      bestScore: 0,
      totalTimeSpent: 0,
      passedQuizzes: 0,
      successRate: 0
    };

    const platformStats = stats.length > 0 ? stats[0] : defaultStats;
    platformStats.successRate = platformStats.totalQuizzesTaken > 0 
      ? (platformStats.passedQuizzes / platformStats.totalQuizzesTaken) * 100 
      : 0;

    res.json({
      success: true,
      data: {
        overall: platformStats,
        byCategory: categoryStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete result
// @route   DELETE /api/results/:id
// @access  Private
exports.deleteResult = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    // Check if user owns the result or is admin
    if (result.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this result'
      });
    }

    await Result.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Result deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};