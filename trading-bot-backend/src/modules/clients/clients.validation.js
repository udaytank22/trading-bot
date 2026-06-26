const { z } = require('zod');

/**
 * Validation rules for Clients module
 */
const validateCreateClient = {
  body: z.object({
    name: z.string().min(1, 'Client name is required and must be a string'),
    email: z.string().email('A valid client email is required'),
    // Note: Add other optional fields using .optional() or .nullable() if they exist in the schema
    phone: z.string().optional(),
    address: z.string().optional(),
    taxId: z.string().optional(),
    status: z.string().optional()
  }).passthrough() // Allow extra fields temporarily during migration
};

const validateUpdateClient = {
  params: z.object({
    id: z.string().min(1, 'Client ID parameter is required')
  }),
  body: z.object({
    name: z.string().min(1, 'Client name is required and must be a string').optional(),
    email: z.string().email('Email address is invalid').optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    taxId: z.string().optional(),
    status: z.string().optional()
  }).passthrough() // Allow extra fields temporarily
};

module.exports = {
  validateCreateClient,
  validateUpdateClient
};
