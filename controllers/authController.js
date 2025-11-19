/**
 * AUTH CONTROLLER
 * Handle user registration, login, logout, password reset
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Patient, Doctor, sequelize } = require('../models');
const authConfig = require('../config/auth');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

/**
 * POST /api/auth/register - Register new user
 */
exports.register = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password, full_name, phone, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email đã được sử dụng' 
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user (password will be hashed by model hooks)
    const user = await User.create({
      email,
      password,
      full_name,
      phone,
      role: role || 'patient',
      verification_token: verificationToken,
      is_verified: false,
      is_active: true
    }, { transaction });

    // Create role-specific record
    if (role === 'patient') {
      await Patient.create({
        user_id: user.id
      }, { transaction });
    } else if (role === 'doctor') {
      await Doctor.create({
        user_id: user.id,
        is_approved: false // Needs admin approval
      }, { transaction });
    }

    await transaction.commit();

    // Send verification email
    const EmailService = require('../services/EmailService');
    try {
      await EmailService.sendVerificationEmail(user, verificationToken);
      await EmailService.sendWelcomeEmail(user);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
      data: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi đăng ký tài khoản',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * POST /api/auth/login - User login
 */
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email hoặc mật khẩu không đúng' 
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ 
        success: false, 
        message: 'Tài khoản đã bị khóa' 
      });
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email hoặc mật khẩu không đúng' 
      });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      authConfig.jwt.secret,
      { expiresIn: authConfig.jwt.accessTokenExpiry }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      authConfig.jwt.secret,
      { expiresIn: authConfig.jwt.refreshTokenExpiry }
    );

    // Save refresh token to database
    await user.update({
      refresh_token: refreshToken,
      last_login: new Date()
    });

    // Set cookie
    res.cookie('access_token', accessToken, authConfig.cookie);
    res.cookie('refresh_token', refreshToken, authConfig.cookie);

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          avatar: user.avatar,
          role: user.role
        },
        access_token: accessToken,
        refresh_token: refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi đăng nhập' 
    });
  }
};

/**
 * POST /api/auth/logout - User logout
 */
exports.logout = async (req, res) => {
  try {
    // Clear refresh token in database
    if (req.user) {
      await req.user.update({ refresh_token: null });
    }

    // Clear cookies
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    res.json({
      success: true,
      message: 'Đăng xuất thành công'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi đăng xuất' 
    });
  }
};

/**
 * POST /api/auth/refresh - Refresh access token
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.cookies;

    if (!refresh_token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Refresh token không tồn tại' 
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refresh_token, authConfig.jwt.secret);
    
    // Get user and verify refresh token
    const user = await User.findByPk(decoded.userId);
    if (!user || user.refresh_token !== refresh_token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Refresh token không hợp lệ' 
      });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      authConfig.jwt.secret,
      { expiresIn: authConfig.jwt.accessTokenExpiry }
    );

    res.cookie('access_token', newAccessToken, authConfig.cookie);

    res.json({
      success: true,
      data: {
        access_token: newAccessToken
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Refresh token không hợp lệ' 
    });
  }
};

/**
 * POST /api/auth/forgot-password - Request password reset
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return res.json({
        success: true,
        message: 'Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await user.update({
      reset_token: resetToken,
      reset_token_expires: resetTokenExpires
    });

    // Send reset email
    const EmailService = require('../services/EmailService');
    try {
      await EmailService.sendPasswordResetEmail(user, resetToken);
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      // Still return success to avoid revealing if email exists
    }

    res.json({
      success: true,
      message: 'Link đặt lại mật khẩu đã được gửi đến email của bạn'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi xử lý yêu cầu' 
    });
  }
};

/**
 * POST /api/auth/reset-password - Reset password with token
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, new_password } = req.body;

    const user = await User.findOne({
      where: {
        reset_token: token,
        reset_token_expires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }

    // Update password and clear reset token
    await user.update({
      password: new_password,
      reset_token: null,
      reset_token_expires: null
    });

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi đặt lại mật khẩu' 
    });
  }
};

/**
 * GET /api/auth/verify-email?token=xxx - Verify email
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    const user = await User.findOne({
      where: { verification_token: token }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token xác thực không hợp lệ'
      });
    }

    await user.update({
      is_verified: true,
      email_verified_at: new Date(),
      verification_token: null
    });

    res.json({
      success: true,
      message: 'Xác thực email thành công'
    });

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi xác thực email' 
    });
  }
};

/**
 * GET /api/auth/me - Get current user info
 */
exports.getCurrentUser = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          full_name: req.user.full_name,
          phone: req.user.phone,
          avatar: req.user.avatar,
          role: req.user.role,
          is_verified: req.user.is_verified
        }
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi lấy thông tin người dùng' 
    });
  }
};
