/**
 * Validation rules for Payments module
 */
const validateCreatePayment = {
  body: (body) => {
    const errors = [];
    if (!body.invoiceId) {
      errors.push('invoiceId is required');
    }
    if (body.amount === undefined || isNaN(parseFloat(body.amount)) || parseFloat(body.amount) <= 0) {
      errors.push('amount is required and must be a number greater than 0');
    }
    if (!body.paymentMode || typeof body.paymentMode !== 'string') {
      errors.push('paymentMode is required');
    }
    if (!body.bankAccountId) {
      errors.push('bankAccountId is required');
    }
    return errors;
  }
};

const validateDeletePayment = {
  params: (params) => {
    const errors = [];
    if (!params.id || params.id.trim() === '') {
      errors.push('Payment ID parameter is required');
    }
    return errors;
  }
};

module.exports = {
  validateCreatePayment,
  validateDeletePayment
};
