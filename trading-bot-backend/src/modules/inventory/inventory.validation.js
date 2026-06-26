const { z } = require('zod');

/**
 * Validation rules for Inventory module
 */
const validateCreateItem = {
  body: z.object({
    itemName: z.string().min(1, 'itemName is required'),
    sku: z.string().min(1, 'sku is required'),
    description: z.string().optional(),
    sellingPrice: z.coerce.number({
      required_error: 'sellingPrice is required and must be a number',
      invalid_type_error: 'sellingPrice must be a number'
    }),
    purchasePrice: z.coerce.number({
      required_error: 'purchasePrice is required and must be a number',
      invalid_type_error: 'purchasePrice must be a number'
    }),
    stockCount: z.coerce.number().optional()
  }).passthrough()
};

const validateMovement = {
  body: z.object({
    inventoryItemId: z.coerce.number({
      required_error: 'inventoryItemId is required',
      invalid_type_error: 'inventoryItemId must be a number'
    }),
    warehouseId: z.coerce.number({
      required_error: 'warehouseId is required',
      invalid_type_error: 'warehouseId must be a number'
    }),
    quantity: z.coerce.number({
      required_error: 'quantity is required and must be a non-zero integer',
      invalid_type_error: 'quantity must be a non-zero integer'
    }).refine((val) => val !== 0, { message: 'quantity must be a non-zero integer' }),
    type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'RESERVED', 'RELEASED'], {
      required_error: 'type is required',
      invalid_type_error: 'type must be one of: IN, OUT, ADJUSTMENT, RESERVED, RELEASED'
    }),
    reference: z.string().optional(),
    notes: z.string().optional()
  }).passthrough()
};

module.exports = {
  validateCreateItem,
  validateMovement
};
