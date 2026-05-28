const { sendError } = require('../utils/response');

/**
 * Global Error Handler middleware for Express
 */
const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Prisma database unique constraint violation (e.g. duplicate SKU or Email)
  if (err.code === 'P2002') {
    statusCode = 400;
    const targets = err.meta && err.meta.target ? err.meta.target.join(', ') : 'fields';
    message = `Duplicate value error: A record with this ${targets} already exists.`;
    errors = [err.meta];
  }

  // Prisma database record not found
  if (err.code === 'P2025') {
    statusCode = 404;
    message = err.meta && err.meta.cause ? err.meta.cause : 'Requested record was not found';
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token signature';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
  }

  return sendError(res, message, errors, statusCode);
};

module.exports = errorHandler;
