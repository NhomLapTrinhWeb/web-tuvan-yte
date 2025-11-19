/**
 * AUTHENTICATION MIDDLEWARE
 * Verify JWT tokens and check user roles
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const authConfig = require('../config/auth');

/**
 * Verify JWT token from cookie or Authorization header
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from cookie or Authorization header
    let token = req.cookies?.access_token;
    
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Vui lòng đăng nhập để tiếp tục' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, authConfig.jwt.secret);
    
    // Get user from database
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ 
        success: false, 
        message: 'Tài khoản không tồn tại hoặc đã bị khóa' 
      });
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Phiên đăng nhập đã hết hạn' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token không hợp lệ' 
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi xác thực' 
    });
  }
};

/**
 * Check if user has specific role(s)
 * @param {string|string[]} roles - Required role(s)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Vui lòng đăng nhập' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền truy cập chức năng này' 
      });
    }

    next();
  };
};

/**
 * Optional authentication - set req.user if token exists but don't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.access_token;
    
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      const decoded = jwt.verify(token, authConfig.jwt.secret);
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password'] }
      });
      
      if (user && user.is_active) {
        req.user = user;
      }
    }
  } catch (error) {
    // Ignore errors in optional auth
  }
  
  next();
};

// Legacy middleware for backward compatibility
exports.requireAuth = authenticate;
exports.requireAdmin = [authenticate, authorize('admin')];

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  requireAuth: authenticate,
  requireAdmin: [authenticate, authorize('admin')]
};
