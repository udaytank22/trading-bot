const { sendError } = require('../utils/response');

/**
 * Express middleware to validate request data (body, query, params)
 * @param {Object} schema - Object containing validation functions for body, query, and params
 */
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    if (schema.body && typeof schema.body === 'function') {
      const bodyErrors = schema.body(req.body);
      if (bodyErrors && bodyErrors.length > 0) {
        errors.push(...bodyErrors);
      }
    }

    if (schema.query && typeof schema.query === 'function') {
      const queryErrors = schema.query(req.query);
      if (queryErrors && queryErrors.length > 0) {
        errors.push(...queryErrors);
      }
    }

    if (schema.params && typeof schema.params === 'function') {
      const paramsErrors = schema.params(req.params);
      if (paramsErrors && paramsErrors.length > 0) {
        errors.push(...paramsErrors);
      }
    }

    if (errors.length > 0) {
      return sendError(res, 'Request validation failed', errors, 400);
    }

    next();
  };
};

module.exports = validate;
