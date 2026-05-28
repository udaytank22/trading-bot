/**
 * Validation rules for notifications
 */
const validateIdParam = {
  params: (params) => {
    const errors = [];
    if (!params.id || params.id.trim() === '') {
      errors.push('Notification ID parameter is required');
    }
    return errors;
  }
};

module.exports = {
  validateIdParam
};
