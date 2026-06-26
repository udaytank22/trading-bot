const { z } = require('zod');

/**
 * Validation rules for Quotations module
 */
const validateGetQuotation = {
  params: z.object({
    id: z.string().min(1, 'Quotation ID is required')
  })
};

module.exports = {
  validateGetQuotation
};
