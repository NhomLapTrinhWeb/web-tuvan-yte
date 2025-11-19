const { body, query } = require('express-validator');

const appointmentValidator = {
  create: [
    body('doctor_id')
      .isInt()
      .withMessage('Valid doctor ID is required'),
    
    body('appointment_date')
      .isDate()
      .withMessage('Valid appointment date is required')
      .custom((value) => {
        const appointmentDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (appointmentDate < today) {
          throw new Error('Appointment date cannot be in the past');
        }
        return true;
      }),
    
    body('time_slot')
      .matches(/^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage('Time slot must be in format HH:MM-HH:MM'),
    
    body('appointment_type')
      .isIn(['online', 'offline'])
      .withMessage('Appointment type must be either online or offline'),
    
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Reason must not exceed 500 characters'),
    
    body('symptoms')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Symptoms must not exceed 1000 characters')
  ],

  cancel: [
    body('reason')
      .notEmpty()
      .withMessage('Cancellation reason is required')
      .isLength({ max: 500 })
      .withMessage('Reason must not exceed 500 characters')
  ],

  getList: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('status')
      .optional()
      .isIn(['pending', 'confirmed', 'completed', 'cancelled', 'no_show'])
      .withMessage('Invalid status')
  ]
};

module.exports = appointmentValidator;
