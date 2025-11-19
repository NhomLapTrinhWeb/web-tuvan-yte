// Authentication & Authorization Middleware
const jwt = require('jsonwebtoken');
const { User, Patient, Doctor } = require('../models');

/**
 * Authenticate user with JWT token
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token xác thực',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token đã hết hạn',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ',
        code: 'INVALID_TOKEN'
      });
    }

    // Get user from database
    const user = await User.findByPk(decoded.userId, {
      include: [
        { model: Patient, required: false },
        { model: Doctor, required: false }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị khóa',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      patientId: user.Patient ? user.Patient.id : null,
      doctorId: user.Doctor ? user.Doctor.id : null
    };

    next();

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xác thực',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Authorize user based on roles
 * @param {...string} roles - Allowed roles
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập',
        code: 'FORBIDDEN',
        required_roles: roles,
        your_role: req.user.role
      });
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      
      if (user && user.is_active) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role
        };
      } else {
        req.user = null;
      }
    } catch (error) {
      req.user = null;
    }

    next();

  } catch (error) {
    console.error('Optional auth error:', error);
    req.user = null;
    next();
  }
};

/**
 * Check if user owns the resource
 * Used for patient accessing their own data
 */
exports.checkOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const resourceId = parseInt(req.params.id);
      
      switch (resourceType) {
        case 'appointment':
          const { Appointment } = require('../models');
          const appointment = await Appointment.findByPk(resourceId);
          
          if (!appointment) {
            return res.status(404).json({
              success: false,
              message: 'Không tìm thấy lịch hẹn'
            });
          }

          // Patient can only access their own appointments
          if (req.user.role === 'patient' && appointment.patient_id !== req.user.patientId) {
            return res.status(403).json({
              success: false,
              message: 'Không có quyền truy cập'
            });
          }

          // Doctor can only access their own appointments
          if (req.user.role === 'doctor' && appointment.doctor_id !== req.user.doctorId) {
            return res.status(403).json({
              success: false,
              message: 'Không có quyền truy cập'
            });
          }

          break;

        case 'medical_record':
          const { MedicalRecord } = require('../models');
          const record = await MedicalRecord.findByPk(resourceId, {
            include: [{ model: Appointment }]
          });
          
          if (!record) {
            return res.status(404).json({
              success: false,
              message: 'Không tìm thấy hồ sơ bệnh án'
            });
          }

          // Check ownership through appointment
          if (req.user.role === 'patient' && 
              record.Appointment.patient_id !== req.user.patientId) {
            return res.status(403).json({
              success: false,
              message: 'Không có quyền truy cập'
            });
          }

          if (req.user.role === 'doctor' && 
              record.Appointment.doctor_id !== req.user.doctorId) {
            return res.status(403).json({
              success: false,
              message: 'Không có quyền truy cập'
            });
          }

          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid resource type'
          });
      }

      next();

    } catch (error) {
      console.error('Check ownership error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi kiểm tra quyền truy cập'
      });
    }
  };
};

/**
 * Check if doctor is approved
 */
exports.requireApprovedDoctor = async (req, res, next) => {
  try {
    if (req.user.role !== 'doctor') {
      return next();
    }

    const { Doctor } = require('../models');
    const doctor = await Doctor.findByPk(req.user.doctorId);

    if (!doctor || !doctor.is_approved) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản bác sĩ chưa được duyệt',
        code: 'DOCTOR_NOT_APPROVED'
      });
    }

    next();

  } catch (error) {
    console.error('Check doctor approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra tài khoản bác sĩ'
    });
  }
};
