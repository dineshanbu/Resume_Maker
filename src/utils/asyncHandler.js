// backend/src/utils/asyncHandler.js

/**
 * Wrapper function to handle async errors in Express routes
 * Eliminates the need for try-catch blocks in controllers
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;