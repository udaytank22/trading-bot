/**
 * Validation rules for Invoices module
 */
const validateCreateInvoice = {
  body: (body) => {
    const errors = [];
    if (!body.clientId) {
      errors.push('clientId is required');
    }
    if (body.subtotal === undefined || isNaN(parseFloat(body.subtotal))) {
      errors.push('subtotal is required and must be a number');
    }
    if (body.items && !Array.isArray(body.items)) {
      errors.push('items must be an array of invoice items');
    }
    return errors;
  }
};

const validateUpdateInvoice = {
  params: (params) => {
    const errors = [];
    if (!params.id || params.id.trim() === '') {
      errors.push('Invoice ID parameter is required');
    }
    return errors;
  },
  body: (body) => {
    const errors = [];
    if (body.subtotal !== undefined && isNaN(parseFloat(body.subtotal))) {
      errors.push('subtotal must be a number');
    }
    if (body.tax !== undefined && isNaN(parseFloat(body.tax))) {
      errors.push('tax must be a number');
    }
    if (body.discount !== undefined && isNaN(parseFloat(body.discount))) {
      errors.push('discount must be a number');
    }
    return errors;
  }
};

module.exports = {
  validateCreateInvoice,
  validateUpdateInvoice
};
