const { z } = require('zod');

/**
 * Validation rules for notifications
 */
const validateIdParam = {
  params: z.object({
    id: z.string().min(1, 'Notification ID parameter is required')
  })
};

module.exports = {
  validateIdParam
};
