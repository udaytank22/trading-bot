const { sendError } = require('../utils/response');

/**
 * Express middleware to validate request data (body, query, params)
 * @param {Object} schema - Object containing validation functions for body, query, and params
 */
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    const validatePart = (partSchema, partData, partName) => {
      if (!partSchema) return;
      
      // Legacy function support
      if (typeof partSchema === 'function') {
        const partErrors = partSchema(partData);
        if (partErrors && partErrors.length > 0) {
          errors.push(...partErrors);
        }
      } 
      // Zod schema support
      else if (typeof partSchema.parse === 'function') {
        const result = partSchema.safeParse(partData);
        if (!result.success) {
          const zodErrors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
          errors.push(...zodErrors);
        } else {
          // Assign coerced data back to req
          req[partName] = result.data;
        }
      }
    };

    validatePart(schema.body, req.body, 'body');
    validatePart(schema.query, req.query, 'query');
    validatePart(schema.params, req.params, 'params');

    if (errors.length > 0) {
      return sendError(res, 'Request validation failed', errors, 400);
    }

    next();
  };
};

module.exports = validate;
