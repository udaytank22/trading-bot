const { z } = require('zod');

/**
 * Validation rules for Authentication module using Zod
 */
const validateLogin = {
  body: z.object({
    email: z.string().email('A valid email is required'),
    password: z.string().min(6, 'Password is required and must be at least 6 characters')
  })
};

const validateRefresh = {
  body: z.object({
    refreshToken: z.string().min(1, 'refreshToken is required')
  })
};

const validateChangePassword = {
  body: z.object({
    oldPassword: z.string().min(1, 'oldPassword is required'),
    newPassword: z.string().min(6, 'newPassword is required and must be at least 6 characters')
  })
};

module.exports = {
  validateLogin,
  validateRefresh,
  validateChangePassword
};
