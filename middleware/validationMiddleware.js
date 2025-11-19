const { validationResult } = require('express-validator');

/**
 * Validation middleware to check for validation errors
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check for errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format errors
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(422).json({
      success: false,
      message: 'Validation error',
      errors: formattedErrors
    });
  };
};

module.exports = { validate };
