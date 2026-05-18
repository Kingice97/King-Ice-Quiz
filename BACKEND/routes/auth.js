const express = require('express');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  createBulkUsers,
  resetPassword,
  recreateUsers
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { validationRules, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', validationRules.register, handleValidationErrors, register);
router.post('/login', validationRules.login, handleValidationErrors, login);

// Protected routes
router.use(protect);

router.post('/logout', logout);
router.get('/me', getMe);
router.put('/profile', validationRules.updateProfile, handleValidationErrors, updateProfile);
router.put('/password', validationRules.changePassword, handleValidationErrors, changePassword);

// Admin only routes
router.use(authorize('admin'));

router.post('/create-bulk-users', createBulkUsers);
router.put('/reset-password', resetPassword);
router.post('/recreate-users', recreateUsers);

// ✅ ADD THIS TEST ENDPOINT (protected)
router.get('/test-token', protect, (req, res) => {
  res.json({
    success: true,
    message: 'Token is working!',
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email
    }
  });
});

module.exports = router;