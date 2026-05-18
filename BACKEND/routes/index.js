const express = require('express');
const authRoutes = require('./auth');
const quizRoutes = require('./quizzes');
const resultRoutes = require('./results');
const userRoutes = require('./users');
const analytics = require('./analytics');
const questions = require('./questions');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/quizzes', quizRoutes);
router.use('/results', resultRoutes);
router.use('/users', userRoutes);
router.use('/analytics', analytics);
router.use('/questions', questions);

module.exports = router;