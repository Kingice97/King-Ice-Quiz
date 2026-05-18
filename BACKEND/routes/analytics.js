const express = require('express');
const {
  getAdminAnalytics,
  getAdminQuizAnalytics,
  getAdminUserAnalytics,
  getAdminScoreDistribution,
  getAdminPopularQuizzes,
  getAdminRecentActivity
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

// Admin-specific analytics routes
router.get('/admin', getAdminAnalytics);
router.get('/admin/quizzes', getAdminQuizAnalytics);
router.get('/admin/users', getAdminUserAnalytics);
router.get('/admin/score-distribution', getAdminScoreDistribution);
router.get('/admin/popular-quizzes', getAdminPopularQuizzes);
router.get('/admin/recent-activity', getAdminRecentActivity);

module.exports = router;