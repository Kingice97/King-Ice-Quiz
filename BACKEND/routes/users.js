const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserProfile,
  getLeaderboard,
  getUserStats,
  toggleUserStatus,
  changeUserRole,
  // NEW: Chat-related routes
  getOnlineUsers,
  searchUsers,
  updateProfilePicture,
  removeProfilePicture,
  updateChatPreferences,
  // NEW: Blocking and reporting
  blockUser,
  unblockUser,
  reportUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/multerUpload');
const { validationRules, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get('/profile/:username', getUserProfile);
router.get('/leaderboard', getLeaderboard);

// Protected routes (for current user)
router.use(protect);

// ✅ FIXED: Move search route BEFORE parameter routes to avoid conflict
router.get('/search/users', searchUsers); // Changed from /search/:query

// NEW: Chat and profile routes
router.get('/online', getOnlineUsers);
router.post('/profile-picture', upload.single('profilePicture'), updateProfilePicture);
router.delete('/profile-picture', removeProfilePicture);
router.put('/chat-preferences', updateChatPreferences);

// NEW: Blocking and reporting routes
router.post('/:id/block', validationRules.idParam, handleValidationErrors, blockUser);
router.post('/:id/unblock', validationRules.idParam, handleValidationErrors, unblockUser);
router.post('/:id/report', validationRules.idParam, handleValidationErrors, reportUser);

// User stats
router.get('/stats', getUserStats);

// Admin only routes
router.use(authorize('admin'));

// Add ID validation for admin routes
router.get('/', getUsers);
router.get('/:id', validationRules.idParam, handleValidationErrors, getUser);
router.put('/:id', validationRules.idParam, handleValidationErrors, updateUser);
router.delete('/:id', validationRules.idParam, handleValidationErrors, deleteUser);
router.put('/:id/status', validationRules.idParam, handleValidationErrors, toggleUserStatus);
router.put('/:id/role', validationRules.idParam, handleValidationErrors, changeUserRole);

module.exports = router;