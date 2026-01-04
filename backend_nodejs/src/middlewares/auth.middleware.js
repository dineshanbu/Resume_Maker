// backend/src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { ApiError } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Verify JWT Token and Authenticate User
 */
const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // Or check in cookies
  else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new ApiError(401, 'Access denied. No token provided');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by ID from token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Your account has been deactivated');
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, 'Invalid token');
    } else if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token expired');
    }
    throw error;
  }
});

/**
 * Authorize based on user roles
 * Usage: authorize('admin', 'employer')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Role '${req.user.role}' is not authorized to access this resource`
      );
    }

    next();
  };
};

/**
 * Optional Authentication - doesn't throw error if no token
 * Useful for routes that work differently for authenticated users
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (user && user.isActive) {
      req.user = user;
    }
  } catch (error) {
    // Silently fail for optional auth
    console.log('Optional auth failed:', error.message);
  }

  next();
});

/**
 * Check if user owns the resource
 * Compares req.user.id with resource's userId
 */
const checkOwnership = (Model, resourceIdParam = 'id', ownerField = 'userId') => {
  return asyncHandler(async (req, res, next) => {
    const resourceId = req.params[resourceIdParam];
    const resource = await Model.findById(resourceId);

    if (!resource) {
      throw new ApiError(404, 'Resource not found');
    }

    // Allow if user is owner or admin
    if (
      resource[ownerField].toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      throw new ApiError(403, 'You do not have permission to access this resource');
    }

    req.resource = resource;
    next();
  });
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  checkOwnership
};