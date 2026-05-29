const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, role, profile } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      role: role || 'user',
      profile: profile || {},
      // NEW: Set initial chat preferences
      preferences: {
        showOnlineStatus: true,
        allowDirectMessages: true,
        chatNotifications: true
      }
    });

    const token = generateToken(user._id);

    // Update last login and set online status
    user.lastLogin = new Date();
    user.isOnline = true; // NEW: Set user as online after registration
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin || false,
        profile: user.profile,
        profilePicture: user.profilePicture, // NEW: Include profile picture
        isOnline: user.isOnline, // NEW: Include online status
        preferences: user.preferences, // NEW: Include preferences
        stats: user.stats,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt for email:', email);

    // Check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('❌ User not found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('✅ User found:', user.username);

    if (!user.isActive) {
      console.log('❌ User account is inactive:', email);
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Check password
    const isPasswordMatch = await user.matchPassword(password);
    console.log('🔑 Password match:', isPasswordMatch);

    if (!isPasswordMatch) {
      console.log('❌ Password does not match for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user._id);

    // Update last login and set online status
    user.lastLogin = new Date();
    user.isOnline = true; // NEW: Set user as online after login
    await user.save();

    console.log('✅ Login successful for:', user.username);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin || false,  // ADD THIS LINE
        profile: user.profile,
        profilePicture: user.profilePicture, // NEW: Include profile picture
        isOnline: user.isOnline, // NEW: Include online status
        preferences: user.preferences, // NEW: Include preferences
        stats: user.stats,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin || false,
        profile: user.profile,
        profilePicture: user.profilePicture, // NEW: Include profile picture
        isOnline: user.isOnline, // NEW: Include online status
        preferences: user.preferences, // NEW: Include preferences
        stats: user.stats,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { username, email, profile, preferences } = req.body;
    
    const updateFields = {};
    if (username) updateFields.username = username;
    if (email) updateFields.email = email;
    if (profile) {
      updateFields.profile = {
        ...req.user.profile,
        ...profile
      };
    }
    // NEW: Update chat preferences
    if (preferences) {
      updateFields.preferences = {
        ...req.user.preferences,
        ...preferences
      };
    }

    // Check if username or email is taken by another user
    if (username || email) {
      const orConditions = [];
      if (username) orConditions.push({ username });
      if (email) orConditions.push({ email });

      const existingUser = await User.findOne({
        $and: [
          { _id: { $ne: req.user.id } },
          { $or: orConditions }
        ]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username or email already taken'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin || false,
        profile: user.profile,
        profilePicture: user.profilePicture, // NEW: Include profile picture
        preferences: user.preferences, // NEW: Include preferences
        stats: user.stats,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isCurrentPasswordMatch = await user.matchPassword(currentPassword);
    
    if (!isCurrentPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
};

// @desc    Create bulk users (for migration)
// @route   POST /api/auth/create-bulk-users
// @access  Public
exports.createBulkUsers = async (req, res, next) => {
  try {
    const { users } = req.body;
    
    if (!users || !Array.isArray(users)) {
      return res.status(400).json({
        success: false,
        message: 'Users array is required'
      });
    }
    
    const createdUsers = [];
    const errors = [];
    
    for (const userData of users) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ 
          $or: [{ email: userData.email }, { username: userData.username }]
        });
        
        if (!existingUser) {
          const user = await User.create(userData);
          createdUsers.push({ 
            id: user._id, 
            username: user.username, 
            email: user.email, 
            role: user.role 
          });
          console.log(`✅ Created user: ${user.username}`);
        } else {
          console.log(`⚠️ User already exists: ${userData.email}`);
          createdUsers.push({
            id: existingUser._id,
            username: existingUser.username,
            email: existingUser.email,
            role: existingUser.role,
            exists: true
          });
        }
      } catch (error) {
        errors.push({
          email: userData.email,
          error: error.message
        });
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }
    
    res.status(201).json({
      success: true,
      message: `Processed ${users.length} users - Created: ${createdUsers.length - errors.length}, Errors: ${errors.length}`,
      data: {
        created: createdUsers,
        errors: errors
      }
    });
  } catch (error) {
    console.error('Create bulk users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating users' 
    });
  }
};

// @desc    Reset user password (for migration troubleshooting)
// @route   PUT /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email and new password are required'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`🔄 Resetting password for user: ${user.email}`);

    // Update password (this will trigger the password hashing)
    user.password = newPassword;
    await user.save();

    console.log(`✅ Password reset successfully for: ${user.email}`);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
};

// @desc    Delete and recreate users (nuclear option)
// @route   POST /api/auth/recreate-users
// @access  Public
exports.recreateUsers = async (req, res, next) => {
  try {
    const { users } = req.body;
    
    const results = [];
    
    for (const userData of users) {
      try {
        // Delete existing user
        await User.deleteOne({ 
          $or: [
            { email: userData.email },
            { username: userData.username }
          ]
        });
        
        console.log(`🗑️ Deleted user: ${userData.email}`);
        
        // Create new user
        const user = await User.create(userData);
        results.push({
          username: user.username,
          email: user.email,
          status: 'created'
        });
        console.log(`✅ Recreated user: ${user.username}`);
      } catch (error) {
        results.push({
          username: userData.username,
          email: userData.email,
          status: 'error',
          error: error.message
        });
        console.error(`❌ Error recreating user ${userData.email}:`, error.message);
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Users recreated successfully',
      data: results
    });
  } catch (error) {
    console.error('Recreate users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error recreating users' 
    });
  }
};

// NEW: Logout user (update online status)
// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Update online status and last active
    user.isOnline = false;
    user.lastActive = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout'
    });
  }
};