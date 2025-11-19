const { body } = require('express-validator');

const userValidator = {
  updateProfile: [
    body('full_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    
    body('phone')
      .optional()
      .matches(/^[0-9]{10,11}$/)
      .withMessage('Phone must be 10-11 digits'),
    
    body('date_of_birth')
      .optional()
      .isDate()
      .withMessage('Valid date of birth is required'),
    
    body('gender')
      .optional()
      .isIn(['male', 'female', 'other'])
      .withMessage('Gender must be male, female, or other'),
    
    body('address')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address must not exceed 200 characters'),
    
    // Patient specific
    body('blood_type')
      .optional()
      .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
      .withMessage('Invalid blood type'),
    
    body('insurance_number')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Insurance number must not exceed 50 characters'),
    
    // Doctor specific
    body('experience_years')
      .optional()
      .isInt({ min: 0, max: 60 })
      .withMessage('Experience years must be between 0 and 60'),
    
    body('consultation_price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Consultation price must be a positive number'),
    
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Bio must not exceed 1000 characters')
  ]
};

module.exports = userValidator;
