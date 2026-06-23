/**
 * Validation rules for Inquiries module
 */
const validateCreateInquiry = {
  body: (body) => {
    const errors = [];
    if (!body.clientId || isNaN(parseInt(body.clientId, 10)) || parseInt(body.clientId, 10) <= 0) {
      errors.push('clientId is required and must be a string');
    }
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      errors.push('At least one item is required in the items array');
    } else {
      body.items.forEach((item, index) => {
        if (!item.description || item.description.trim() === '') {
          errors.push(`Item at index ${index} must have a description`);
        }
        if (item.quantity === undefined || isNaN(parseInt(item.quantity, 10)) || parseInt(item.quantity, 10) <= 0) {
          errors.push(`Item at index ${index} must have a valid quantity greater than 0`);
        }
      });
    }
    return errors;
  }
};

const validateCreatePublicInquiry = {
  body: (body) => {
    const errors = [];
    if (!body.clientName || body.clientName.trim() === '') {
      errors.push('clientName is required');
    }
    if (!body.clientEmail || body.clientEmail.trim() === '') {
      errors.push('clientEmail is required');
    }
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      errors.push('At least one item is required in the items array');
    } else {
      body.items.forEach((item, index) => {
        if (!item.description || item.description.trim() === '') {
          errors.push(`Item at index ${index} must have a description`);
        }
        if (item.quantity === undefined || isNaN(parseInt(item.quantity, 10)) || parseInt(item.quantity, 10) <= 0) {
          errors.push(`Item at index ${index} must have a valid quantity greater than 0`);
        }
      });
    }
    return errors;
  }
};

const validateUpdateInquiry = {
  params: (params) => {
    const errors = [];
    if (!params.id || params.id.trim() === '') {
      errors.push('Inquiry ID is required');
    }
    return errors;
  }
};

const validateStockCheck = {
  params: (params) => {
    const errors = [];
    if (!params.id || params.id.trim() === '') {
      errors.push('Inquiry ID is required');
    }
    return errors;
  },
  body: (body) => {
    const errors = [];
    if (body.supplierIds && !Array.isArray(body.supplierIds)) {
      errors.push('supplierIds must be an array');
    }
    return errors;
  }
};

const validateSupplierQuote = {
  params: (params) => {
    const errors = [];
    if (!params.id || params.id.trim() === '') {
      errors.push('Inquiry ID is required');
    }
    return errors;
  },
  body: (body) => {
    const errors = [];
    if (!body.supplierId) {
      errors.push('supplierId is required');
    }
    if (body.quoteAmount === undefined || isNaN(parseFloat(body.quoteAmount))) {
      errors.push('quoteAmount is required and must be a number');
    }
    if (body.taxAmount === undefined || isNaN(parseFloat(body.taxAmount))) {
      errors.push('taxAmount is required and must be a number');
    }
    if (body.finalAmount === undefined || isNaN(parseFloat(body.finalAmount))) {
      errors.push('finalAmount is required and must be a number');
    }
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      errors.push('items is required and must be an array of quote items');
    }
    return errors;
  }
};

const validateClientQuote = {
  params: (params) => {
    const errors = [];
    if (!params.id || params.id.trim() === '') {
      errors.push('Inquiry ID is required');
    }
    return errors;
  },
  body: (body) => {
    const errors = [];
    if (body.marginPercentage === undefined || isNaN(parseFloat(body.marginPercentage))) {
      errors.push('marginPercentage is required and must be a number');
    }
    if (body.taxPercentage === undefined || isNaN(parseFloat(body.taxPercentage))) {
      errors.push('taxPercentage is required and must be a number');
    }
    if (body.totalAmount === undefined || isNaN(parseFloat(body.totalAmount))) {
      errors.push('totalAmount is required and must be a number');
    }
    if (body.finalAmount === undefined || isNaN(parseFloat(body.finalAmount))) {
      errors.push('finalAmount is required and must be a number');
    }
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      errors.push('items is required and must be an array of quotation items');
    }
    return errors;
  }
};

const validateApproval = {
  params: (params) => {
    const errors = [];
    if (!params.id || params.id.trim() === '') {
      errors.push('Inquiry ID is required');
    }
    return errors;
  },
  body: (body) => {
    const errors = [];
    if (body.approved === undefined || typeof body.approved !== 'boolean') {
      errors.push('approved is required and must be a boolean');
    }
    return errors;
  }
};

const validateClientDecision = {
  params: (params) => {
    const errors = [];
    if (!params.id || params.id.trim() === '') {
      errors.push('Inquiry ID is required');
    }
    return errors;
  },
  body: (body) => {
    const errors = [];
    if (body.accepted === undefined || typeof body.accepted !== 'boolean') {
      errors.push('accepted is required and must be a boolean');
    }
    return errors;
  }
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
