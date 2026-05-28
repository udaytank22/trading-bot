/**
 * Validation rules for Clients module
 */
const validateCreateClient = {
  body: (body) => {
    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      errors.push('Client name is required and must be a string');
    }
    if (!body.email || !emailRegex.test(body.email)) {
      errors.push('A valid client email is required');
    }
    return errors;
  }
};

const validateUpdateClient = {
  params: (params) => {
    const errors = [];
    if (!params.id || params.id.trim() === '') {
      errors.push('Client ID parameter is required');
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
  validateCreateClient,
  validateUpdateClient
};
