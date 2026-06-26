const { z } = require('zod');

/**
 * Validation rules for Inquiries module
 */
const validateCreateInquiry = {
  body: z.object({
    clientId: z.coerce.number({
      required_error: 'clientId is required and must be a number',
      invalid_type_error: 'clientId must be a number'
    }).refine((val) => val > 0, { message: 'clientId must be greater than 0' }),
    items: z.array(z.object({
      description: z.string().min(1, 'Item must have a description'),
      quantity: z.coerce.number({
        required_error: 'quantity is required',
        invalid_type_error: 'quantity must be a number'
      }).refine((val) => val > 0, { message: 'quantity must be greater than 0' }),
      targetPrice: z.coerce.number().optional(),
      productId: z.coerce.number().optional()
    })).min(1, 'At least one item is required in the items array'),
    status: z.string().optional()
  }).passthrough()
};

const validateCreatePublicInquiry = {
  body: z.object({
    clientName: z.string().min(1, 'clientName is required'),
    clientEmail: z.string().email('clientEmail is required and must be a valid email'),
    items: z.array(z.object({
      description: z.string().min(1, 'Item must have a description'),
      quantity: z.coerce.number({
        required_error: 'quantity is required',
        invalid_type_error: 'quantity must be a number'
      }).refine((val) => val > 0, { message: 'quantity must be greater than 0' }),
      targetPrice: z.coerce.number().optional(),
      productId: z.coerce.number().optional()
    })).min(1, 'At least one item is required in the items array')
  }).passthrough()
};

const validateUpdateInquiry = {
  params: z.object({
    id: z.string().min(1, 'Inquiry ID is required')
  }),
  body: z.object({
    status: z.string().optional()
  }).passthrough()
};

const validateStockCheck = {
  params: z.object({
    id: z.string().min(1, 'Inquiry ID is required')
  }),
  body: z.object({
    supplierIds: z.array(z.string()).optional()
  }).passthrough()
};

const validateSupplierQuote = {
  params: z.object({
    id: z.string().min(1, 'Inquiry ID is required')
  }),
  body: z.object({
    supplierId: z.coerce.number({
      required_error: 'supplierId is required',
      invalid_type_error: 'supplierId must be a number'
    }),
    quoteAmount: z.coerce.number({
      required_error: 'quoteAmount is required and must be a number',
      invalid_type_error: 'quoteAmount must be a number'
    }),
    taxAmount: z.coerce.number({
      required_error: 'taxAmount is required and must be a number',
      invalid_type_error: 'taxAmount must be a number'
    }),
    finalAmount: z.coerce.number({
      required_error: 'finalAmount is required and must be a number',
      invalid_type_error: 'finalAmount must be a number'
    }),
    items: z.array(z.any()).min(1, 'items is required and must be an array of quote items')
  }).passthrough()
};

const validateClientQuote = {
  params: z.object({
    id: z.string().min(1, 'Inquiry ID is required')
  }),
  body: z.object({
    marginPercentage: z.coerce.number({
      required_error: 'marginPercentage is required and must be a number',
      invalid_type_error: 'marginPercentage must be a number'
    }),
    taxPercentage: z.coerce.number({
      required_error: 'taxPercentage is required and must be a number',
      invalid_type_error: 'taxPercentage must be a number'
    }),
    totalAmount: z.coerce.number({
      required_error: 'totalAmount is required and must be a number',
      invalid_type_error: 'totalAmount must be a number'
    }),
    finalAmount: z.coerce.number({
      required_error: 'finalAmount is required and must be a number',
      invalid_type_error: 'finalAmount must be a number'
    }),
    items: z.array(z.any()).min(1, 'items is required and must be an array of quotation items')
  }).passthrough()
};

const validateApproval = {
  params: z.object({
    id: z.string().min(1, 'Inquiry ID is required')
  }),
  body: z.object({
    approved: z.boolean({
      required_error: 'approved is required and must be a boolean',
      invalid_type_error: 'approved must be a boolean'
    })
  }).passthrough()
};

const validateClientDecision = {
  params: z.object({
    id: z.string().min(1, 'Inquiry ID is required')
  }),
  body: z.object({
    accepted: z.boolean({
      required_error: 'accepted is required and must be a boolean',
      invalid_type_error: 'accepted must be a boolean'
    })
  }).passthrough()
};

module.exports = {
  validateCreateInquiry,
  validateCreatePublicInquiry,
  validateUpdateInquiry,
  validateStockCheck,
  validateSupplierQuote,
  validateClientQuote,
  validateApproval,
  validateClientDecision
};
