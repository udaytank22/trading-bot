const { z } = require('zod');

/**
 * Validation rules for Documents module
 */
const validateCreateDocument = {
  body: z.object({
    title: z.string().min(1, 'title is required'),
    category: z.string().min(1, 'category is required'),
    entityType: z.enum(['EMPLOYEE', 'VEHICLE', 'COMPANY', 'SUPPLIER', 'CLIENT', 'INQUIRY', 'PO', 'INVOICE'], {
      required_error: 'entityType is required and must be one of: EMPLOYEE, VEHICLE, COMPANY, SUPPLIER, CLIENT, INQUIRY, PO, INVOICE',
      invalid_type_error: 'entityType must be one of: EMPLOYEE, VEHICLE, COMPANY, SUPPLIER, CLIENT, INQUIRY, PO, INVOICE'
    }),
    entityId: z.coerce.number({
      required_error: 'entityId is required',
      invalid_type_error: 'entityId must be a number'
    }),
    fileUrl: z.string().optional(),
    description: z.string().optional()
  }).passthrough()
};

const validateUpdateDocument = {
  params: z.object({
    id: z.string().min(1, 'Document ID parameter is required')
  }),
  body: z.object({
    title: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    entityType: z.enum(['EMPLOYEE', 'VEHICLE', 'COMPANY', 'SUPPLIER', 'CLIENT', 'INQUIRY', 'PO', 'INVOICE']).optional(),
    entityId: z.coerce.number().optional(),
    fileUrl: z.string().optional(),
    description: z.string().optional()
  }).passthrough()
};

module.exports = {
  validateCreateDocument,
  validateUpdateDocument
};
