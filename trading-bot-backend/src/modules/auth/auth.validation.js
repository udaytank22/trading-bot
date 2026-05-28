/**
 * Validation rules for Authentication module
 */
const validateLogin = {
  body: (body) => {
    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!body.email || !emailRegex.test(body.email)) {
      errors.push('A valid email is required');
    }
    if (!body.password || typeof body.password !== 'string' || body.password.length < 6) {
      errors.push('Password is required and must be at least 6 characters');
    }
    return errors;
  }
};

const validateRefresh = {
  body: (body) => {
    const errors = [];
    if (!body.refreshToken || typeof body.refreshToken !== 'string' || body.refreshToken.trim() === '') {
      errors.push('refreshToken is required');
    }
    return errors;
  }
};

const validateChangePassword = {
  body: (body) => {
    const errors = [];
    if (!body.oldPassword || typeof body.oldPassword !== 'string' || body.oldPassword.trim() === '') {
      errors.push('oldPassword is required');
    }
    if (!body.newPassword || typeof body.newPassword !== 'string' || body.newPassword.length < 6) {
      errors.push('newPassword is required and must be at least 6 characters');
    }
    return errors;
  }
};

module.exports = {
  validateLogin,
  validateRefresh,
  validateChangePassword
};
