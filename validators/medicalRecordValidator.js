const { body } = require('express-validator');

const medicalRecordValidator = {
  create: [
    body('appointment_id')
      .isInt()
      .withMessage('Valid appointment ID is required'),
    
    body('diagnosis')
      .notEmpty()
      .withMessage('Diagnosis is required')
      .isLength({ max: 1000 })
      .withMessage('Diagnosis must not exceed 1000 characters'),
    
    body('prescription')
      .optional()
      .isArray()
      .withMessage('Prescription must be an array'),
    
    body('prescription.*.drug_name')
      .if(body('prescription').exists())
      .notEmpty()
      .withMessage('Drug name is required'),
    
    body('prescription.*.dosage')
      .if(body('prescription').exists())
      .notEmpty()
      .withMessage('Dosage is required'),
    
    body('prescription.*.frequency')
      .if(body('prescription').exists())
      .notEmpty()
      .withMessage('Frequency is required'),
    
    body('vital_signs')
      .optional()
      .isObject()
      .withMessage('Vital signs must be an object'),
    
    body('lab_results')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('Lab results must not exceed 2000 characters'),
    
    body('notes')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('Notes must not exceed 2000 characters')
  ],

  update: [
    body('diagnosis')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Diagnosis must not exceed 1000 characters'),
    
    body('prescription')
      .optional()
      .isArray()
      .withMessage('Prescription must be an array'),
    
    body('vital_signs')
      .optional()
      .isObject()
      .withMessage('Vital signs must be an object')
  ]
};

module.exports = medicalRecordValidator;
