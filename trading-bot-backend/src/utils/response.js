/**
 * Helper to send standard success response
 */
const sendSuccess = (res, message = 'Operation completed successfully', data = {}, statusCode = 200, meta = undefined) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta && { meta })
  });
};

/**
 * Helper to send standard error response
 */
const sendError = (res, message = 'Internal Server Error', errors = [], statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors: Array.isArray(errors) ? errors : [errors]
  });
};

module.exports = {
  sendSuccess,
  sendError
};
