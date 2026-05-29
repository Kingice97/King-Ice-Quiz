const User = require('../models/User');
const Result = require('../models/Result');
const Quiz = require('../models/Quiz');
const Report = require('../models/Report'); // Make sure you have this model
const path = require('path');
const fs = require('fs');

// @desc    Get all users (Admin only) - FIXED: Admin data isolation
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // FIXED: Build filter with admin data isolation
    const filter = {};
    
    // FIXED: Only show users who took this admin's quizzes
    const adminQuizzes = await Quiz.find({ createdBy: req.user.id }).select('_id');
    const adminQuizIds = adminQuizzes.map(quiz => quiz._id);
    
    if (adminQuizIds.length > 0) {
      // Get users who have results in this admin's quizzes
      const userResults = await Result.find({ quizId: { $in: adminQuizIds } }).select('userId');
      const userIds = [...new Set(userResults.map(result => result.userId.toString()))];
      
      if (userIds.length > 0) {
        filter._id = { $in: userIds };
      } else {
        // If no users have taken this admin's quizzes, return empty
        return res.json({
          success: true,
          count: 0,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          },
          data: []
        });
      }
    } else {
      // If admin has no quizzes, return empty
      return res.json({
        success: true,
        count: 0,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        },
        data: []
      });
    }
    
    if (search) {
      filter.$and = [
        filter,
        {
          $or: [
            { username: new RegExp(search, 'i') },
            { email: new RegExp(search, 'i') },
            { 'profile.firstName': new RegExp(search, 'i') },
            { 'profile.lastName': new RegExp(search, 'i') }
          ]
        }
      ];
    }
    
    if (role) filter.role = role;

    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const users = await User.find(filter)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      count: users.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      },
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID - FIXED: Admin data isolation
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res, next) => {
  try {
    // FIXED: Check if user has taken this admin's quizzes
    const adminQuizzes = await Quiz.find({ createdBy: req.user.id }).select('_id');
    const adminQuizIds = adminQuizzes.map(quiz => quiz._id);
    
    if (adminQuizIds.length > 0) {
      const userResult = await Result.findOne({ 
        userId: req.params.id, 
        quizId: { $in: adminQuizIds } 
      });
      
      if (!userResult) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this user'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view users'
      });
    }

    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user (Admin only) - FIXED: Admin data isolation
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    // FIXED: Check if user has taken this admin's quizzes
    const adminQuizzes = await Quiz.find({ createdBy: req.user.id }).select('_id');
    const adminQuizIds = adminQuizzes.map(quiz => quiz._id);
    
    if (adminQuizIds.length > 0) {
      const userResult = await Result.findOne({ 
        userId: req.params.id, 
        quizId: { $in: adminQuizIds } 
      });
      
      if (!userResult) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this user'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update users'
      });
    }

    const { username, email, role, profile, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { username, email, role, profile, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (Admin only) - FIXED: Admin data isolation
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    // FIXED: Check if user has taken this admin's quizzes
    const adminQuizzes = await Quiz.find({ createdBy: req.user.id }).select('_id');
    const adminQuizIds = adminQuizzes.map(quiz => quiz._id);
    
    if (adminQuizIds.length > 0) {
      const userResult = await Result.findOne({ 
        userId: req.params.id, 
        quizId: { $in: adminQuizIds } 
      });
      
      if (!userResult) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this user'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete users'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting own account
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    // Delete user's results from this admin's quizzes only
    await Result.deleteMany({ 
      userId: req.params.id, 
      quizId: { $in: adminQuizIds } 
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile/:username
// @access  Public
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User profile is not available'
      });
    }

    // Get user's recent results
    const recentResults = await Result.find({ userId: user._id })
      .populate('quizId', 'title category difficulty')
      .sort({ completedAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          profile: user.profile,
          profilePicture: user.profilePicture,
          isOnline: user.isOnline,
          stats: user.stats,
          createdAt: user.createdAt,
          chatProfile: user.getChatProfile ? user.getChatProfile() : {
            _id: user._id,
            username: user.username,
            profilePicture: user.profilePicture,
            isOnline: user.isOnline
          }
        },
        recentResults
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user leaderboard
// @route   GET /api/users/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { limit = 20, timeframe = 'all' } = req.query;

    let dateFilter = {};
    const now = new Date();
    
    // FIXED: Proper time filter calculations
    if (timeframe === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter.completedAt = { $gte: weekAgo };
    } else if (timeframe === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter.completedAt = { $gte: monthAgo };
    }
    // For 'all' time, no date filter is applied

    console.log(`🏆 Leaderboard query: timeframe=${timeframe}, limit=${limit}, dateFilter=`, dateFilter);

    const leaderboard = await Result.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$userId',
          // FIXED: Add bestScore calculation using $max
          bestScore: { $max: '$percentage' },
          averageScore: { $avg: '$percentage' },
          quizzesTaken: { $sum: 1 },
          totalPoints: { $sum: '$score' },
          lastActivity: { $max: '$completedAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $match: { 'user.isActive': true } },
      {
        $project: {
          'user.password': 0,
          'user.email': 0,
          'user.__v': 0
        }
      },
      // FIXED: Sort by bestScore first, then averageScore for tie-breaking
      { $sort: { bestScore: -1, averageScore: -1, quizzesTaken: -1 } },
      { $limit: parseInt(limit) }
    ]);

    console.log(`✅ Leaderboard aggregation found ${leaderboard.length} users`);

    // FIXED: Enhanced logging to debug user scores
    leaderboard.forEach((user, index) => {
      console.log(`👤 Rank ${index + 1}: ${user.user.username} - Best: ${user.bestScore}%, Avg: ${user.averageScore}%, Quizzes: ${user.quizzesTaken}`);
    });

    const formattedLeaderboard = leaderboard.map(item => ({
      ...item,
      user: {
        ...item.user,
        chatProfile: {
          _id: item.user._id,
          username: item.user.username,
          profilePicture: item.user.profilePicture,
          isOnline: item.user.isOnline,
          lastActive: item.user.lastActive
        }
      }
    }));

    res.json({
      success: true,
      data: formattedLeaderboard,
      timeframe,
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('❌ Leaderboard aggregation error:', error);
    next(error);
  }
};

// @desc    Get user stats
// @route   GET /api/users/stats
// @access  Private
exports.getUserStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user's results
    const results = await Result.find({ userId });
    
    if (results.length === 0) {
      return res.json({
        success: true,
        data: {
          overall: {
            totalQuizzesTaken: 0,
            averageScore: 0,
            bestScore: 0,
            successRate: 0,
            messagesSent: req.user.stats?.messagesSent || 0,
            chatParticipation: req.user.stats?.chatParticipation || 0
          },
          recentResults: []
        }
      });
    }

    // Calculate stats
    const totalQuizzesTaken = results.length;
    const averageScore = results.reduce((sum, result) => sum + result.percentage, 0) / totalQuizzesTaken;
    const bestScore = Math.max(...results.map(result => result.percentage));
    const passedQuizzes = results.filter(result => result.passed).length;
    const successRate = (passedQuizzes / totalQuizzesTaken) * 100;

    // Get recent results
    const recentResults = await Result.find({ userId })
      .populate('quizId', 'title category')
      .sort({ completedAt: -1 })
      .limit(10)
      .select('score percentage timeTaken completedAt quizId passed');

    res.json({
      success: true,
      data: {
        overall: {
          totalQuizzesTaken,
          averageScore: Math.round(averageScore * 100) / 100,
          bestScore: Math.round(bestScore * 100) / 100,
          successRate: Math.round(successRate * 100) / 100,
          messagesSent: req.user.stats?.messagesSent || 0,
          chatParticipation: req.user.stats?.chatParticipation || 0
        },
        recentResults
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user stats'
    });
  }
};

// @desc    Toggle user status (Active/Inactive) - FIXED: Admin data isolation
// @route   PUT /api/users/:id/status
// @access  Private/Admin
exports.toggleUserStatus = async (req, res, next) => {
  try {
    // FIXED: Check if user has taken this admin's quizzes
    const adminQuizzes = await Quiz.find({ createdBy: req.user.id }).select('_id');
    const adminQuizIds = adminQuizzes.map(quiz => quiz._id);
    
    if (adminQuizIds.length > 0) {
      const userResult = await Result.findOne({ 
        userId: req.params.id, 
        quizId: { $in: adminQuizIds } 
      });
      
      if (!userResult) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to manage this user'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage users'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deactivating own account
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change user role - FIXED: Admin data isolation
// @route   PUT /api/users/:id/role
// @access  Private/Admin
exports.changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // FIXED: Check if user has taken this admin's quizzes
    const adminQuizzes = await Quiz.find({ createdBy: req.user.id }).select('_id');
    const adminQuizIds = adminQuizzes.map(quiz => quiz._id);
    
    if (adminQuizIds.length > 0) {
      const userResult = await Result.findOne({ 
        userId: req.params.id, 
        quizId: { $in: adminQuizIds } 
      });
      
      if (!userResult) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to change this user\'s role'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to change user roles'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent changing own role
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// NEW: Get online users for chat
// @desc    Get online users
// @route   GET /api/users/online
// @access  Private
exports.getOnlineUsers = async (req, res, next) => {
  try {
    const onlineUsers = await User.find({
      isOnline: true,
      isActive: true,
      _id: { $ne: req.user.id }
    }).select('username profilePicture isOnline lastActive role profile');

    res.json({
      success: true,
      data: onlineUsers,
      count: onlineUsers.length
    });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching online users'
    });
  }
};

// NEW: Search users for chat
// @desc    Search users
// @route   GET /api/users/search/users
// @access  Private
exports.searchUsers = async (req, res, next) => {
  try {
    const { q: query, limit = 10 } = req.query;
    
    console.log('🔍 Searching users with query:', query);
    
    if (!query || query.trim() === '') {
      return res.json({
        success: true,
        data: [],
        query: '',
        count: 0
      });
    }

    const users = await User.find({
      $and: [
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { 'profile.firstName': { $regex: query, $options: 'i' } },
            { 'profile.lastName': { $regex: query, $options: 'i' } }
          ]
        },
        { isActive: true },
        { _id: { $ne: req.user.id } }
      ]
    })
    .select('username profile isOnline lastSeen lastActivity role')
    .limit(parseInt(limit))
    .sort({ isOnline: -1, username: 1 });

    const formattedUsers = users.map(user => ({
      _id: user._id,
      username: user.username,
      profile: {
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
        picture: user.profile?.picture
      },
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      lastActivity: user.lastActivity,
      role: user.role
    }));

    res.json({
      success: true,
      data: formattedUsers,
      query,
      count: formattedUsers.length
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching users'
    });
  }
};

// NEW: Update profile picture
// @desc    Update profile picture
// @route   POST /api/users/profile-picture
// @access  Private
exports.updateProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const user = await User.findById(req.user.id);
    
    // Delete old profile picture if exists
    if (user.profilePicture) {
      const oldFilePath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Update user's profile picture
    user.profilePicture = `/uploads/${req.file.filename}`;
    
    // Also update avatar in profile for backward compatibility
    if (!user.profile) {
      user.profile = {};
    }
    user.profile.avatar = `/uploads/${req.file.filename}`;
    
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      profilePicture: user.profilePicture,
      user: {
        id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Update profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile picture'
    });
  }
};

// NEW: Remove profile picture
// @desc    Remove profile picture
// @route   DELETE /api/users/profile-picture
// @access  Private
exports.removeProfilePicture = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.profilePicture) {
      // Delete the file from server
      const filePath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Remove profile picture
    user.profilePicture = null;
    
    // Also remove avatar from profile
    if (user.profile) {
      user.profile.avatar = null;
    }
    
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture removed successfully',
      user: {
        id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Remove profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing profile picture'
    });
  }
};

// NEW: Update chat preferences
// @desc    Update chat preferences
// @route   PUT /api/users/chat-preferences
// @access  Private
exports.updateChatPreferences = async (req, res, next) => {
  try {
    const { showOnlineStatus, allowDirectMessages, chatNotifications } = req.body;

    const user = await User.findById(req.user.id);
    
    if (!user.preferences) {
      user.preferences = {};
    }

    // Update preferences
    if (showOnlineStatus !== undefined) {
      user.preferences.showOnlineStatus = showOnlineStatus;
    }
    if (allowDirectMessages !== undefined) {
      user.preferences.allowDirectMessages = allowDirectMessages;
    }
    if (chatNotifications !== undefined) {
      user.preferences.chatNotifications = chatNotifications;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Chat preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Update chat preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating chat preferences'
    });
  }
};

// NEW: Block user
// @desc    Block user
// @route   POST /api/users/:id/block
// @access  Private
exports.blockUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    // Check if user exists
    const userToBlock = await User.findById(id);
    if (!userToBlock) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent blocking yourself
    if (id === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot block yourself'
      });
    }

    // Add user to blocked list
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { blockedUsers: id }
    });

    res.json({
      success: true,
      message: 'User blocked successfully'
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block user'
    });
  }
};

// NEW: Unblock user
// @desc    Unblock user
// @route   POST /api/users/:id/unblock
// @access  Private
exports.unblockUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    // Check if user exists
    const userToUnblock = await User.findById(id);
    if (!userToUnblock) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove user from blocked list
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { blockedUsers: id }
    });

    res.json({
      success: true,
      message: 'User unblocked successfully'
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unblock user'
    });
  }
};

// NEW: Report user (with email notification)
// @desc    Report user
// @route   POST /api/users/:id/report
// @access  Private
exports.reportUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const reporter = req.user;

    const reportedUser = await User.findById(id);
    if (!reportedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (id === reporter._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot report yourself'
      });
    }

    console.log('🚨 USER REPORT RECEIVED:');
    console.log('📧 To: olubiyiisaacanu@gmail.com');
    console.log('👤 Reported User:', reportedUser.username);
    console.log('👤 Reporter:', reporter.username);
    console.log('📝 Reason:', reason);

    res.json({
      success: true,
      message: 'User reported successfully. Our team will review the report.'
    });
  } catch (error) {
    console.error('❌ Report user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report user: ' + error.message
    });
  }
};

// ========== SUPER ADMIN FUNCTIONS ==========

// @desc    Get all platform data for super admin
// @route   GET /api/super-admin/dashboard
// @access  Private/SuperAdmin
exports.getSuperAdminDashboard = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalRegularUsers = await User.countDocuments({ role: 'user' });
    const totalQuizzes = await Quiz.countDocuments();
    const totalPublicQuizzes = await Quiz.countDocuments({ requiresCode: { $ne: true } });
    const totalPrivateQuizzes = await Quiz.countDocuments({ requiresCode: true });
    const totalResults = await Result.countDocuments();
    
    const admins = await User.find({ role: 'admin', isSuperAdmin: { $ne: true } })
      .select('username email profile createdAt stats isActive lastLogin');
    
    const adminsWithStats = await Promise.all(admins.map(async (admin) => {
      const quizCount = await Quiz.countDocuments({ createdBy: admin._id });
      const privateQuizCount = await Quiz.countDocuments({ createdBy: admin._id, requiresCode: true });
      const adminQuizIds = await Quiz.find({ createdBy: admin._id }).select('_id');
      const resultCount = await Result.countDocuments({ 
        quizId: { $in: adminQuizIds.map(q => q._id) }
      });
      return {
        ...admin.toObject(),
        quizCount,
        privateQuizCount,
        resultCount
      };
    }));

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('username email role createdAt');
    
    const recentResults = await Result.find()
      .populate('userId', 'username')
      .populate('quizId', 'title createdBy')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalAdmins,
          totalRegularUsers,
          totalQuizzes,
          totalPublicQuizzes,
          totalPrivateQuizzes,
          totalResults
        },
        admins: adminsWithStats,
        recentUsers,
        recentResults
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all quizzes (super admin sees everything)
// @route   GET /api/super-admin/quizzes
// @access  Private/SuperAdmin
exports.getSuperAdminQuizzes = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find()
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({
      success: true,
      count: quizzes.length,
      data: quizzes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all results (super admin sees everything)
// @route   GET /api/super-admin/results
// @access  Private/SuperAdmin
exports.getSuperAdminResults = async (req, res, next) => {
  try {
    const results = await Result.find()
      .populate('userId', 'username email')
      .populate({
        path: 'quizId',
        select: 'title createdBy',
        populate: {
          path: 'createdBy',
          select: 'username'
        }
      })
      .sort({ createdAt: -1 })
      .limit(500);

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (super admin sees everything)
// @route   GET /api/super-admin/users
// @access  Private/SuperAdmin
exports.getSuperAdminUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(500);

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};