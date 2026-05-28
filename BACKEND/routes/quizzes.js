const express = require('express');
const quizController = require('../controllers/quizController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Public routes - NO AUTH
router.get('/', quizController.getQuizzes);
router.get('/:id', quizController.getQuiz);
router.get('/:id/leaderboard', quizController.getQuizLeaderboard);

// ✅ ADD BACK THE MISSING ROUTE
router.get('/:id/with-answers', authMiddleware.protect, quizController.getQuizWithAnswers);

// Protected routes
router.use(authMiddleware.protect);
router.post('/:id/submit', quizController.submitQuiz);

// Admin routes
router.post('/', authMiddleware.authorize('admin'), quizController.createQuiz);
router.put('/:id', authMiddleware.authorize('admin'), quizController.updateQuiz);
router.delete('/:id', authMiddleware.authorize('admin'), quizController.deleteQuiz);
router.get('/:id/results', authMiddleware.authorize('admin'), quizController.getQuizResults);

// Quiz status management
router.put('/:id/close', authMiddleware.authorize('admin'), quizController.closeQuiz);
router.put('/:id/open', authMiddleware.authorize('admin'), quizController.openQuiz);
router.put('/:id/expire', authMiddleware.authorize('admin'), quizController.setQuizExpiration);

// Admin data isolation
router.get('/admin/my-quizzes', authMiddleware.authorize('admin'), quizController.getAdminQuizzes);
router.get('/admin/my-results', authMiddleware.authorize('admin'), quizController.getAdminResults);

// Access code routes
router.post('/join-by-code', authMiddleware.protect, quizController.joinByCode);
router.post('/:id/generate-code', authMiddleware.authorize('admin'), quizController.generateAccessCode);
router.delete('/:id/access-code', authMiddleware.authorize('admin'), quizController.removeAccessCode);
router.get('/code/:code/results', authMiddleware.authorize('admin'), quizController.getResultsByCode);

module.exports = router;