const { z } = require('zod');

/**
 * Validation rules for Audit Logs endpoints
 */
const validateGetAuditLogs = {
  query: z.object({
    page: z.coerce.number().optional(),
    limit: z.coerce.number().optional()
  }).passthrough()
};

module.exports = {
  validateGetAuditLogs
};
