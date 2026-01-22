// backend/src/utils/apiResponse.js

class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
  }
}

class ApiError extends Error {
  constructor(statusCode, message = 'Something went wrong', errors = [], stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.message = message;
    this.errors = errors;
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Success Response Helpers
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
};

const createdResponse = (res, data, message = 'Resource created successfully') => {
  return res.status(201).json(new ApiResponse(201, data, message));
};

// Error Response Helpers
const errorResponse = (res, message = 'Something went wrong', statusCode = 500, errors = []) => {
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors
  });
};

const badRequestResponse = (res, message = 'Bad request', errors = []) => {
  return errorResponse(res, message, 400, errors);
};

const unauthorizedResponse = (res, message = 'Unauthorized access') => {
  return errorResponse(res, message, 401);
};

const forbiddenResponse = (res, message = 'Forbidden') => {
  return errorResponse(res, message, 403);
};

const notFoundResponse = (res, message = 'Resource not found') => {
  return errorResponse(res, message, 404);
};

const conflictResponse = (res, message = 'Resource already exists') => {
  return errorResponse(res, message, 409);
};

const validationErrorResponse = (res, errors) => {
  return errorResponse(res, 'Validation failed', 422, errors);
};

module.exports = {
  ApiResponse,
  ApiError,
  successResponse,
  createdResponse,
  errorResponse,
  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  validationErrorResponse
};