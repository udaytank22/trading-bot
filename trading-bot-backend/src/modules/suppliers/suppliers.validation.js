/**
 * Validation rules for Suppliers module
 */
const validateCreateSupplier = {
  body: (body) => {
    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      errors.push('Supplier name is required and must be a string');
    }
    if (!body.email || !emailRegex.test(body.email)) {
      errors.push('A valid supplier email is required');
    }
    return errors;
  }
};

const validateUpdateSupplier = {
  params: (params) => {
    const errors = [];
    if (!params.id || params.id.trim() === '') {
      errors.push('Supplier ID parameter is required');
    }
    return errors;
  },
  body: (body) => {
    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (body.email && !emailRegex.test(body.email)) {
      errors.push('Email address is invalid');
    }
    return errors;
  }
};

module.exports = {
  validateCreateSupplier,
  validateUpdateSupplier
};
