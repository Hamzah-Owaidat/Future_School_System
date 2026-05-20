// Utility helper functions

/**
 * Async handler wrapper to catch errors in async route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Wrapped function
 */
exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {Object} data - Data to send
 * @param {String} message - Success message
 */
exports.sendSuccessResponse = (res, statusCode = 200, data = null, message = 'Success') => {
  res.status(statusCode).json({
    success: true,
    message,
    ...(data && { data })
  });
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error message
 */
exports.sendErrorResponse = (res, statusCode = 500, message = 'Internal server error') => {
  res.status(statusCode).json({
    success: false,
    error: message
  });
};

