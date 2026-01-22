// backend/src/middlewares/profile.validation.middleware.js
const { body, validationResult } = require('express-validator');
const { validationErrorResponse } = require('../utils/apiResponse');

/**
 * Check for validation errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));
    
    return validationErrorResponse(res, formattedErrors);
  }
  
  next();
};

/**
 * Profile validation rules
 */
const profileValidation = [
  // Basic Info
  body('fullName')
    .optional()
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 3, max: 50 }).withMessage('Name must be 3-50 characters'),
  
  body('phone')
    .optional()
    .trim()
    .notEmpty().withMessage('Phone is required')
    .matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601().withMessage('Invalid date format')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13 || age > 100) {
        throw new Error('Date of birth must be valid (age between 13-100)');
      }
      return true;
    }),
  
  body('gender')
    .optional()
    .isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other'),
  
  // Location
  body('country')
    .optional()
    .trim()
    .notEmpty().withMessage('Country is required'),
  
  body('state')
    .optional()
    .trim()
    .notEmpty().withMessage('State is required'),
  
  body('city')
    .optional()
    .trim()
    .notEmpty().withMessage('City is required'),
  
  // Professional Summary
  body('headline')
    .optional()
    .trim()
    .notEmpty().withMessage('Headline is required')
    .isLength({ max: 100 }).withMessage('Headline cannot exceed 100 characters'),
  
  body('aboutMe')
    .optional()
    .trim()
    .notEmpty().withMessage('About me is required')
    .isLength({ max: 500 }).withMessage('About me cannot exceed 500 characters'),
  
  // Employment Preferences
  body('currentRole')
    .optional()
    .trim()
    .notEmpty().withMessage('Current role is required'),
  
  body('experienceYears')
    .optional()
    .isInt({ min: 0, max: 50 }).withMessage('Experience years must be between 0 and 50'),
  
  body('experienceMonths')
    .optional()
    .isInt({ min: 0, max: 11 }).withMessage('Experience months must be between 0 and 11'),
  
  body('employmentType')
    .optional()
    .isIn(['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'])
    .withMessage('Invalid employment type'),
  
  body('jobType')
    .optional()
    .trim()
    .notEmpty().withMessage('Job type is required'),
  
  body('noticePeriod')
    .optional()
    .isIn(['Immediate', '1 Week', '2 Weeks', '1 Month', '2 Months', '3 Months'])
    .withMessage('Invalid notice period'),
  
  body('expectedSalary')
    .optional()
    .isFloat({ min: 0 }).withMessage('Expected salary must be a positive number')
    .custom((value) => {
      // Allow 0 or null for freshers
      if (value === 0 || value === null || value === undefined) return true;
      return value >= 0;
    }),
  
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'])
    .withMessage('Invalid currency'),
  
  body('preferredLocations')
    .optional()
    .isArray().withMessage('Preferred locations must be an array'),
  
  // Skills
  body('primarySkills')
    .optional()
    .isArray({ min: 1 }).withMessage('At least one primary skill is required'),
  
  body('primarySkills.*')
    .optional()
    .trim()
    .notEmpty().withMessage('Primary skill cannot be empty'),
  
  body('secondarySkills')
    .optional()
    .isArray(),
  
  body('toolsTechnologies')
    .optional()
    .isArray(),
  
  // Education
  body('education')
    .optional()
    .isArray({ min: 1 }).withMessage('At least one education entry is required'),
  
  body('education.*.degree')
    .optional()
    .trim()
    .notEmpty().withMessage('Degree is required'),
  
  body('education.*.institution')
    .optional()
    .trim()
    .notEmpty().withMessage('Institution is required'),
  
  body('education.*.passingYear')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 5 })
    .withMessage('Invalid passing year'),
  
  body('education.*.grade')
    .optional()
    .trim()
    .notEmpty().withMessage('Grade is required'),
  
  // Online Profiles
  body('linkedInUrl')
    .optional()
    .trim()
    .isURL().withMessage('Invalid LinkedIn URL'),
  
  body('githubUrl')
    .optional()
    .trim()
    .isURL().withMessage('Invalid GitHub URL'),
  
  body('portfolioUrl')
    .optional()
    .trim()
    .isURL().withMessage('Invalid portfolio URL'),
  
  validate
];

module.exports = {
  profileValidation
};
