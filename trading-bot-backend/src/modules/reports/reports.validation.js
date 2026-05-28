/**
 * Validation rules for Reports module
 */
const validateDateFilter = {
  query: (query) => {
    const errors = [];
    if (query.startDate && isNaN(Date.parse(query.startDate))) {
      errors.push('startDate must be a valid date string');
    }
    if (query.endDate && isNaN(Date.parse(query.endDate))) {
      errors.push('endDate must be a valid date string');
    }
    return errors;
  }
};

module.exports = {
  validateDateFilter
};
