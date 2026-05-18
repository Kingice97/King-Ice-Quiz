const rateLimit = require('express-rate-limit');

// API rate limiting
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter auth rate limiting
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter upload rate limiting
exports.uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 uploads per 15 minutes
  message: {
    success: false,
    message: 'Too many upload attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// SQL injection and NoSQL injection protection
exports.sanitizeInput = (req, res, next) => {
  // Remove MongoDB operators from req.body
  const sanitize = (obj) => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (key.startsWith('$') || key === 'where' || key === 'expr') {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          sanitize(obj[key]);
        }
      });
    }
    return obj;
  };
  
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  
  next();
};

// XSS Protection headers
exports.securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
};

// Request logging for security monitoring
exports.securityLogger = (req, res, next) => {
  const securityEvents = ['login', 'register', 'password-reset', 'admin-action'];
  const path = req.path.toLowerCase();
  
  if (securityEvents.some(event => path.includes(event))) {
    console.log(`🔐 SECURITY EVENT: ${req.method} ${req.path} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
  }
  
  next();
};