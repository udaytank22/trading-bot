/**
 * Validation rules for Users module
 */
const validateCreateUser = {
  body: (body) => {
    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!body.email || !emailRegex.test(body.email)) {
      errors.push('A valid email is required');
    }
    if (!body.password || typeof body.password !== 'string' || body.password.length < 6) {
      errors.push('Password is required and must be at least 6 characters');
    }
    if (!body.roleId) {
      errors.push('roleId is required');
    } else if (typeof body.roleId !== 'string' && typeof body.roleId !== 'number') {
      errors.push('roleId must be a string or number');
    }
    return errors;
  }
};

const validateUpdateUser = {
  params: (params) => {
    const errors = [];
    if (!params.id || params.id.trim() === '') {
      errors.push('User ID parameter is required');
    }
    return errors;
  },
  body: (body) => {
    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (body.email && !emailRegex.test(body.email)) {
      errors.push('Email is invalid');
    }
    if (body.password && (typeof body.password !== 'string' || body.password.length < 6)) {
      errors.push('Password must be at least 6 characters');
    }
    return errors;
  }
};

module.exports = {
  validateCreateUser,
  validateUpdateUser
};
