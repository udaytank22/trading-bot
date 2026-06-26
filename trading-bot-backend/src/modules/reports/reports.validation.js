const { z } = require('zod');

/**
 * Validation rules for Reports module
 */
const validateDateFilter = {
  query: z.object({
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'startDate must be a valid date string' }).optional(),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'endDate must be a valid date string' }).optional()
  }).passthrough()
};

module.exports = {
  validateDateFilter
};
