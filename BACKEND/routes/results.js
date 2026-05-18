const express = require('express');
const {
  getUserResults,
  getAllResults,
  getResult,
  getQuizResults,
  getQuizResultsAdmin,
  getBestResult,
  getUserStats,
  getPlatformStats,
  deleteResult
} = require('../controllers/resultController');
const { protect, authorize } = require('../middleware/auth');
const Quiz = require('../models/Quiz');
const Result = require('../models/Result');

const router = express.Router();

router.use(protect);

// User routes
router.get('/', getUserResults);
router.get('/stats', getUserStats);
router.get('/quiz/:quizId', getQuizResults);
router.get('/quiz/:quizId/best', getBestResult);
router.get('/:id', getResult);
router.delete('/:id', deleteResult);

// Admin only routes
router.get('/admin/all', authorize('admin'), getAllResults);
router.get('/admin/quiz/:quizId', authorize('admin'), getQuizResultsAdmin);
router.get('/admin/stats', authorize('admin'), getPlatformStats);

// NEW: Get quiz count for a specific user (Admin only)
router.get('/user/:userId/count', authorize('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Count results for this user from admin's quizzes only
    const adminQuizzes = await Quiz.find({ createdBy: req.user.id }).select('_id');
    const adminQuizIds = adminQuizzes.map(quiz => quiz._id);
    
    const quizCount = await Result.countDocuments({
      userId: userId,
      quizId: { $in: adminQuizIds }
    });
    
    res.json({
      success: true,
      count: quizCount
    });
  } catch (error) {
    console.error('Error counting user quizzes:', error);
    res.status(500).json({
      success: false,
      message: 'Error counting user quizzes'
    });
  }
});

module.exports = router;