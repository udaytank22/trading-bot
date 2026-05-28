/**
 * Validation rules for Purchase Orders module
 */
const validateCreatePO = {
  body: (body) => {
    const errors = [];
    if (!body.supplierId) {
      errors.push('supplierId is required');
    }
    if (!body.clientId) {
      errors.push('clientId is required');
    }
    if (body.amount === undefined || isNaN(parseFloat(body.amount))) {
      errors.push('amount is required and must be a number');
    }
    if (body.items && !Array.isArray(body.items)) {
      errors.push('items must be an array of PO items');
    }
    return errors;
  }
};

const validateUpdatePO = {
  params: (params) => {
    const errors = [];
    if (!params.id || params.id.trim() === '') {
      errors.push('PO ID is required');
    }
    return errors;
  },
  body: (body) => {
    const errors = [];
    if (body.amount !== undefined && isNaN(parseFloat(body.amount))) {
      errors.push('amount must be a number');
    }
    if (body.items && !Array.isArray(body.items)) {
      errors.push('items must be an array of PO items');
    }
    return errors;
  }
};

module.exports = {
  validateCreatePO,
  validateUpdatePO
};
