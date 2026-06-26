const { z } = require('zod');

/**
 * Validation rules for Suppliers module
 */
const validateCreateSupplier = {
  body: z.object({
    name: z.string().min(1, 'Supplier name is required and must be a string'),
    email: z.string().email('A valid supplier email is required'),
    phone: z.string().optional(),
    address: z.string().optional(),
    status: z.string().optional(),
    taxId: z.string().optional()
  }).passthrough()
};

const validateUpdateSupplier = {
  params: z.object({
    id: z.string().min(1, 'Supplier ID parameter is required')
  }),
  body: z.object({
    name: z.string().min(1, 'Supplier name is required and must be a string').optional(),
    email: z.string().email('Email address is invalid').optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    status: z.string().optional(),
    taxId: z.string().optional()
  }).passthrough()
};

module.exports = {
  validateCreateSupplier,
  validateUpdateSupplier
};
