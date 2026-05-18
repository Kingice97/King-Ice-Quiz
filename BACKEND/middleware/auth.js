const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      console.log('🔐 Token decoded:', { id: decoded.id });
      
      // Get user from the token
      const user = await User.findById(decoded.id);
      
      if (!user) {
        console.error('❌ User not found for token:', decoded.id);
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // ✅ FIXED: Set req.user properly
      req.user = {
        id: user._id,
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile
      };

      console.log('✅ User authenticated:', req.user.username);
      next();
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    console.error('💥 Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};