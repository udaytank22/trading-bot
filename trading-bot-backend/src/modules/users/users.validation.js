const { z } = require('zod');

/**
 * Validation rules for Users module
 */
const validateCreateUser = {
  body: z.object({
    email: z.string().email('A valid email is required'),
    password: z.string().min(6, 'Password is required and must be at least 6 characters'),
    roleId: z.coerce.number({
      required_error: 'roleId is required',
      invalid_type_error: 'roleId must be a number'
    }),
    fullName: z.string().optional(),
    avatarUrl: z.string().optional()
  }).passthrough()
};

const validateUpdateUser = {
  params: z.object({
    id: z.string().min(1, 'User ID parameter is required')
  }),
  body: z.object({
    email: z.string().email('Email is invalid').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    roleId: z.coerce.number({
      invalid_type_error: 'roleId must be a number'
    }).optional(),
    fullName: z.string().optional(),
    avatarUrl: z.string().optional()
  }).passthrough()
};

module.exports = {
  validateCreateUser,
  validateUpdateUser
};
