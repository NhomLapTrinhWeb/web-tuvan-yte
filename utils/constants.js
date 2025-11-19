/**
 * APPLICATION CONSTANTS
 * Centralized constants to avoid magic numbers
 */

module.exports = {
  // Time constants
  TIME: {
    ONE_MINUTE: 60 * 1000,
    ONE_HOUR: 60 * 60 * 1000,
    ONE_DAY: 24 * 60 * 60 * 1000,
    ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
    ONE_MONTH: 30 * 24 * 60 * 60 * 1000
  },

  // Session and JWT expiry
  SESSION: {
    MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
    SECRET_MIN_LENGTH: 32
  },

  JWT: {
    ACCESS_TOKEN_EXPIRY: '15m',
    REFRESH_TOKEN_EXPIRY: '7d',
    RESET_TOKEN_EXPIRY: '1h'
  },

  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  },

  // Upload limits
  UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_FILES: 10,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },

  // Appointment constants
  APPOINTMENT: {
    DEFAULT_SLOT_DURATION: 30, // minutes
    MIN_ADVANCE_BOOKING: 2 * 60 * 60 * 1000, // 2 hours
    MAX_ADVANCE_BOOKING: 90 * 24 * 60 * 60 * 1000, // 90 days
    CANCELLATION_DEADLINE: 24 * 60 * 60 * 1000, // 24 hours before
    REMINDER_TIME: 60 * 60 * 1000 // 1 hour before
  },

  // Doctor schedule
  SCHEDULE: {
    MIN_WORKING_HOURS: 1,
    MAX_WORKING_HOURS: 12,
    MAX_PATIENTS_PER_SLOT: 5
  },

  // Review constants
  REVIEW: {
    MIN_RATING: 1,
    MAX_RATING: 5,
    MAX_COMMENT_LENGTH: 1000
  },

  // Chat constants
  CHAT: {
    MAX_MESSAGE_LENGTH: 2000,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    TYPING_TIMEOUT: 3000 // 3 seconds
  },

  // Notification retention
  NOTIFICATION: {
    RETENTION_DAYS: 30,
    MAX_PER_USER: 1000
  },

  // Payment constants
  PAYMENT: {
    CURRENCY: 'VND',
    VNPAY_MULTIPLIER: 100, // VNPay uses cents
    REFUND_PROCESSING_DAYS: 7
  },

  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
    AUTH_MAX_REQUESTS: 5,
    PAYMENT_MAX_REQUESTS: 10
  },

  // User roles
  ROLES: {
    ADMIN: 'admin',
    DOCTOR: 'doctor',
    PATIENT: 'patient'
  },

  // Status enums
  STATUS: {
    APPOINTMENT: {
      PENDING: 'pending',
      CONFIRMED: 'confirmed',
      IN_PROGRESS: 'in_progress',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled',
      NO_SHOW: 'no_show'
    },
    PAYMENT: {
      PENDING: 'pending',
      PAID: 'paid',
      FAILED: 'failed',
      REFUNDED: 'refunded',
      REFUND_REQUESTED: 'refund_requested'
    },
    USER: {
      ACTIVE: true,
      INACTIVE: false
    }
  },

  // Appointment types
  APPOINTMENT_TYPE: {
    ONLINE: 'online',
    OFFLINE: 'offline'
  },

  // Gender options
  GENDER: {
    MALE: 'male',
    FEMALE: 'female',
    OTHER: 'other'
  },

  // Error codes
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    TIME_SLOT_UNAVAILABLE: 'TIME_SLOT_UNAVAILABLE',
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    SERVER_ERROR: 'SERVER_ERROR'
  },

  // Success messages
  MESSAGES: {
    SUCCESS: {
      CREATED: 'Tạo thành công',
      UPDATED: 'Cập nhật thành công',
      DELETED: 'Xóa thành công',
      LOGIN: 'Đăng nhập thành công',
      LOGOUT: 'Đăng xuất thành công',
      REGISTER: 'Đăng ký thành công',
      EMAIL_SENT: 'Email đã được gửi'
    },
    ERROR: {
      INTERNAL: 'Lỗi hệ thống',
      NOT_FOUND: 'Không tìm thấy',
      UNAUTHORIZED: 'Chưa đăng nhập',
      FORBIDDEN: 'Không có quyền truy cập',
      VALIDATION: 'Dữ liệu không hợp lệ',
      CONFLICT: 'Dữ liệu bị trùng lặp'
    }
  }
};
