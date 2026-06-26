const { z } = require('zod');

/**
 * Validation rules for Payments module
 */
const validateCreatePayment = {
  body: z.object({
    invoiceId: z.coerce.number({
      required_error: 'invoiceId is required',
      invalid_type_error: 'invoiceId must be a number'
    }),
    amount: z.coerce.number({
      required_error: 'amount is required and must be a number greater than 0',
      invalid_type_error: 'amount must be a number greater than 0'
    }).refine((val) => val > 0, { message: 'amount must be greater than 0' }),
    paymentMode: z.string().min(1, 'paymentMode is required'),
    bankAccountId: z.coerce.number({
      required_error: 'bankAccountId is required',
      invalid_type_error: 'bankAccountId must be a number'
    }),
    referenceNo: z.string().optional(),
    paymentDate: z.string().optional(),
    notes: z.string().optional()
  }).passthrough()
};

const validateDeletePayment = {
  params: z.object({
    id: z.string().min(1, 'Payment ID parameter is required')
  })
};

module.exports = {
  validateCreatePayment,
  validateDeletePayment
};
