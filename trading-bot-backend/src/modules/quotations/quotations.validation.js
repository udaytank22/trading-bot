/**
 * Validation rules for Quotations module
 */
const validateGetQuotation = {
  params: (params) => {
    const errors = [];
    if (!params.id || params.id.trim() === '') {
      errors.push('Quotation ID is required');
    }
    return errors;
  }
};

module.exports = {
  validateGetQuotation
};
