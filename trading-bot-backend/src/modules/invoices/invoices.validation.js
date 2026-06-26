const { z } = require('zod');

/**
 * Validation rules for Invoices module
 */
const validateCreateInvoice = {
  body: z.object({
    clientId: z.string().min(1, 'clientId is required'),
    subtotal: z.coerce.number({
      required_error: 'subtotal is required and must be a number',
      invalid_type_error: 'subtotal must be a number'
    }),
    tax: z.coerce.number().optional(),
    discount: z.coerce.number().optional(),
    total: z.coerce.number().optional(),
    items: z.array(z.any()).optional().describe('items must be an array of invoice items'),
    // other optional fields
    shipmentId: z.string().optional(),
    inquiryId: z.string().optional(),
    purchaseOrderId: z.string().optional(),
    invoiceNumber: z.string().optional(),
    status: z.string().optional(),
    paymentStatus: z.string().optional(),
    currency: z.string().optional()
  }).passthrough()
};

const validateUpdateInvoice = {
  params: z.object({
    id: z.string().min(1, 'Invoice ID parameter is required')
  }),
  body: z.object({
    clientId: z.string().optional(),
    subtotal: z.coerce.number({
      invalid_type_error: 'subtotal must be a number'
    }).optional(),
    tax: z.coerce.number({
      invalid_type_error: 'tax must be a number'
    }).optional(),
    discount: z.coerce.number({
      invalid_type_error: 'discount must be a number'
    }).optional(),
    total: z.coerce.number().optional(),
    items: z.array(z.any()).optional(),
    shipmentId: z.string().optional(),
    inquiryId: z.string().optional(),
    purchaseOrderId: z.string().optional(),
    invoiceNumber: z.string().optional(),
    status: z.string().optional(),
    paymentStatus: z.string().optional(),
    currency: z.string().optional()
  }).passthrough()
};

module.exports = {
  validateCreateInvoice,
  validateUpdateInvoice
};
