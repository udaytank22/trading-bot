const { z } = require('zod');

/**
 * Validation rules for Roles module
 */
const validateCreateRole = {
  body: z.object({
    name: z.string().min(1, 'Role name is required and must be a string'),
    permissionIds: z.array(z.string()).optional()
  }).passthrough()
};

const validateUpdateRole = {
  params: z.object({
    id: z.string().min(1, 'Role ID is required')
  }),
  body: z.object({
    permissionIds: z.array(z.string(), {
      required_error: 'permissionIds is required and must be an array of permission IDs',
      invalid_type_error: 'permissionIds must be an array of permission IDs'
    })
  }).passthrough()
};

module.exports = {
  validateCreateRole,
  validateUpdateRole
};
