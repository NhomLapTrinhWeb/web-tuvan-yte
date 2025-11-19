const { body } = require('express-validator');

const authValidator = {
  register: [
    body('email')
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    
    body('full_name')
      .trim()
      .notEmpty()
      .withMessage('Full name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    
    body('phone')
      .optional()
      .matches(/^[0-9]{10,11}$/)
      .withMessage('Phone must be 10-11 digits'),
    
    body('role')
      .isIn(['patient', 'doctor'])
      .withMessage('Role must be either patient or doctor')
  ],

  login: [
    body('email')
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  forgotPassword: [
    body('email')
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail()
  ],

  resetPassword: [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ],

  changePassword: [
    body('current_password')
      .notEmpty()
      .withMessage('Current password is required'),
    
    body('new_password')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters')
  ]
};

module.exports = authValidator;
