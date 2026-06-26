const { z } = require('zod');

/**
 * Validation rules for Purchase Orders module
 */
const validateCreatePO = {
  body: z.object({
    supplierId: z.coerce.number({
      required_error: 'supplierId is required',
      invalid_type_error: 'supplierId must be a number'
    }),
    clientId: z.coerce.number({
      required_error: 'clientId is required',
      invalid_type_error: 'clientId must be a number'
    }),
    amount: z.coerce.number({
      required_error: 'amount is required and must be a number',
      invalid_type_error: 'amount must be a number'
    }),
    items: z.array(z.any()).optional().describe('items must be an array of PO items'),
    inquiryId: z.string().optional(),
    poNumber: z.string().optional(),
    status: z.string().optional()
  }).passthrough()
};

const validateUpdatePO = {
  params: z.object({
    id: z.string().min(1, 'PO ID is required')
  }),
  body: z.object({
    supplierId: z.coerce.number().optional(),
    clientId: z.coerce.number().optional(),
    amount: z.coerce.number({
      invalid_type_error: 'amount must be a number'
    }).optional(),
    items: z.array(z.any()).optional().describe('items must be an array of PO items'),
    inquiryId: z.string().optional(),
    poNumber: z.string().optional(),
    status: z.string().optional()
  }).passthrough()
};

module.exports = {
  validateCreatePO,
  validateUpdatePO
};
