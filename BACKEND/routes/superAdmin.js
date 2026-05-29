const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const superAdminCheck = (req, res, next) => {
  if (!req.user || !req.user.isSuperAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Super admin access required'
    });
  }
  next();
};

router.use(authMiddleware.protect);
router.use(superAdminCheck);

router.get('/dashboard', userController.getSuperAdminDashboard);
router.get('/quizzes', userController.getSuperAdminQuizzes);
router.get('/results', userController.getSuperAdminResults);
router.get('/users', userController.getSuperAdminUsers);

module.exports = router;