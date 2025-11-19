/**
 * ERROR HANDLER MIDDLEWARE
 * Centralized error handling
 */

const constants = require('../utils/constants');

/**
 * Custom error class
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async handler wrapper to avoid try-catch in every route
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Not found handler
 */
const notFound = (req, res, next) => {
  const error = new AppError(
    `Route not found - ${req.originalUrl}`,
    404,
    constants.ERROR_CODES.NOT_FOUND
  );
  next(error);
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      statusCode: error.statusCode
    });
  }

  // Mongoose/Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const message = Object.values(err.errors).map(e => e.message).join(', ');
    error = new AppError(message, 400, constants.ERROR_CODES.VALIDATION_ERROR);
  }

  // Mongoose/Sequelize duplicate key error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = Object.keys(err.fields)[0];
    const message = `Duplicate field value: ${field}`;
    error = new AppError(message, 409, constants.ERROR_CODES.CONFLICT);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401, constants.ERROR_CODES.AUTHENTICATION_REQUIRED);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401, constants.ERROR_CODES.AUTHENTICATION_REQUIRED);
  }

  // Send error response
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    code: error.code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  AppError,
  asyncHandler,
  notFound,
  errorHandler
};
