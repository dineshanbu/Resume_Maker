// backend/src/middlewares/validation.middleware.js
const { body, param, query, validationResult } = require('express-validator');
const { validationErrorResponse } = require('../utils/apiResponse');

/**
 * Check for validation errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => {
      // Map first_name field errors to fullName for frontend
      let fieldName = err.path || err.param;
      if (fieldName === 'first_name') {
        fieldName = 'fullName'; // Frontend expects fullName
      }
      
      return {
        field: fieldName,
        message: err.msg,
        value: err.value
      };
    });
    
    return validationErrorResponse(res, formattedErrors);
  }
  
  next();
};

// ==================== USER VALIDATIONS ====================

const signupValidation = [
  // Accept first_name from frontend, validate it, then map to fullName
  body('first_name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 3, max: 50 }).withMessage('Name must be 3-50 characters')
    .customSanitizer((value, { req }) => {
      // Map first_name to fullName for controller
      if (value) {
        req.body.fullName = value;
      }
      return value;
    }),
  
  // Also accept fullName for backward compatibility
  body('fullName')
    .optional()
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 3, max: 50 }).withMessage('Name must be 3-50 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  
  body('phone_no')
    .optional()
    .matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  
  body('phone')
    .optional()
    .matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  
  body('role')
    .optional()
    .isIn(['user', 'employer','admin']).withMessage('Invalid role'),
  
  validate
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  validate
];

// ==================== RESUME VALIDATIONS ====================

const createResumeValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Resume title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  
  body('templateId')
    .notEmpty().withMessage('Template ID is required')
    .isMongoId().withMessage('Invalid template ID'),
  
  body('resumeData')
    .optional()
    .isObject().withMessage('Resume data must be an object'),
  
  // Personal info validation - only validate if provided and status is not Draft
  body('resumeData.personalInfo')
    .optional()
    .isObject().withMessage('Personal info must be an object'),
  
  body('resumeData.personalInfo.fullName')
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty().withMessage('Full name is required'),
  
  body('resumeData.personalInfo.email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().withMessage('Invalid email'),
  
  body('resumeData.personalInfo.phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9]{10,15}$/).withMessage('Invalid phone number'),
  
  body('status')
    .optional()
    .isIn(['Draft', 'Completed']).withMessage('Status must be Draft or Completed'),
  
  validate
];

const updateResumeValidation = [
  param('id')
    .isMongoId().withMessage('Invalid resume ID'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  
  validate
];

// ==================== JOB VALIDATIONS ====================

const createJobValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Job title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  
  body('company.name')
    .trim()
    .notEmpty().withMessage('Company name is required'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Job description is required')
    .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),
  
  body('category')
    .notEmpty().withMessage('Job category is required')
    .isIn([
      'IT & Software',
      'Sales & Marketing',
      'Finance & Accounting',
      'Human Resources',
      'Engineering',
      'Healthcare',
      'Education',
      'Customer Service',
      'Operations',
      'Design & Creative',
      'Other'
    ]).withMessage('Invalid job category'),
  
  body('jobType')
    .notEmpty().withMessage('Job type is required')
    .isIn(['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'])
    .withMessage('Invalid job type'),
  
  body('workMode')
    .notEmpty().withMessage('Work mode is required')
    .isIn(['On-site', 'Remote', 'Hybrid'])
    .withMessage('Invalid work mode'),
  
  body('location.city')
    .trim()
    .notEmpty().withMessage('City is required'),
  
  body('location.state')
    .trim()
    .notEmpty().withMessage('State is required'),
  
  body('salary.min')
    .notEmpty().withMessage('Minimum salary is required')
    .isNumeric().withMessage('Salary must be a number')
    .custom((value, { req }) => {
      if (req.body.salary?.max && value > req.body.salary.max) {
        throw new Error('Minimum salary cannot be greater than maximum salary');
      }
      return true;
    }),
  
  body('salary.max')
    .notEmpty().withMessage('Maximum salary is required')
    .isNumeric().withMessage('Salary must be a number'),
  
  body('applicationDeadline')
    .notEmpty().withMessage('Application deadline is required')
    .isISO8601().withMessage('Invalid date format')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Application deadline must be in the future');
      }
      return true;
    }),
  
  body('contactEmail')
    .trim()
    .notEmpty().withMessage('Contact email is required')
    .isEmail().withMessage('Invalid email'),
  
  body('vacancies')
    .optional()
    .isInt({ min: 1 }).withMessage('Vacancies must be at least 1'),
  
  validate
];

const updateJobValidation = [
  param('id')
    .isMongoId().withMessage('Invalid job ID'),
  
  body('applicationDeadline')
    .optional()
    .isISO8601().withMessage('Invalid date format')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Application deadline must be in the future');
      }
      return true;
    }),
  
  validate
];

// ==================== APPLICATION VALIDATIONS ====================

const applyJobValidation = [
  param('jobId')
    .isMongoId().withMessage('Invalid job ID'),
  
  body('resumeId')
    .notEmpty().withMessage('Resume ID is required')
    .isMongoId().withMessage('Invalid resume ID'),
  
  body('coverLetter')
    .optional()
    .isLength({ max: 2000 }).withMessage('Cover letter cannot exceed 2000 characters'),
  
  body('expectedSalary.amount')
    .optional()
    .isNumeric().withMessage('Expected salary must be a number'),
  
  validate
];

const updateApplicationStatusValidation = [
  param('id')
    .isMongoId().withMessage('Invalid application ID'),
  
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn([
      'Applied',
      'Under Review',
      'Shortlisted',
      'Interview Scheduled',
      'Interviewed',
      'Offered',
      'Accepted',
      'Rejected',
      'Withdrawn'
    ]).withMessage('Invalid status'),
  
  validate
];

// ==================== COMMON VALIDATIONS ====================

const idParamValidation = [
  param('id').isMongoId().withMessage('Invalid ID'),
  validate
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  validate
];

module.exports = {
  validate,
  signupValidation,
  loginValidation,
  createResumeValidation,
  updateResumeValidation,
  createJobValidation,
  updateJobValidation,
  applyJobValidation,
  updateApplicationStatusValidation,
  idParamValidation,
  paginationValidation
};