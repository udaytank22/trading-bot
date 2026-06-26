const { z } = require('zod');

/**
 * Validation rules for Products module
 */
const validateCreateProduct = {
  body: z.object({
    name: z.string().min(1, 'Product name is required and must be a string'),
    sku: z.string().min(1, 'Product SKU is required'),
    sellingPrice: z.coerce.number({
      required_error: 'sellingPrice is required and must be a number',
      invalid_type_error: 'sellingPrice must be a number'
    }),
    purchasePrice: z.coerce.number({
      required_error: 'purchasePrice is required and must be a number',
      invalid_type_error: 'purchasePrice must be a number'
    }),
    category: z.string().optional(),
    description: z.string().optional(),
    stockCount: z.coerce.number().optional()
  }).passthrough()
};

const validateUpdateProduct = {
  params: z.object({
    id: z.string().min(1, 'Product ID parameter is required')
  }),
  body: z.object({
    name: z.string().min(1, 'Product name is required and must be a string').optional(),
    sku: z.string().min(1, 'Product SKU is required').optional(),
    sellingPrice: z.coerce.number({
      invalid_type_error: 'sellingPrice must be a number'
    }).optional(),
    purchasePrice: z.coerce.number({
      invalid_type_error: 'purchasePrice must be a number'
    }).optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    stockCount: z.coerce.number().optional()
  }).passthrough()
};

module.exports = {
  validateCreateProduct,
  validateUpdateProduct
};
