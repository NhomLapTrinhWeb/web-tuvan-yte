const jwt = require('jsonwebtoken');

const tokenUtils = {
  /**
   * Generate JWT token
   */
  generateToken(payload, expiresIn = '24h') {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  },

  /**
   * Generate refresh token (longer expiry)
   */
  generateRefreshToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
  },

  /**
   * Generate email verification token
   */
  generateVerificationToken(userId) {
    return jwt.sign({ userId, type: 'email_verification' }, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });
  },

  /**
   * Generate password reset token
   */
  generatePasswordResetToken(userId) {
    return jwt.sign({ userId, type: 'password_reset' }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });
  },

  /**
   * Verify token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  },

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token) {
    return jwt.decode(token);
  }
};

module.exports = tokenUtils;
