/**
 * Validation rules for Audit Logs endpoints
 */
const validateGetAuditLogs = {
  query: (query) => {
    const errors = [];
    if (query.page && isNaN(parseInt(query.page, 10))) {
      errors.push('Page parameter must be an integer');
    }
    if (query.limit && isNaN(parseInt(query.limit, 10))) {
      errors.push('Limit parameter must be an integer');
    }
    return errors;
  }
};

module.exports = {
  validateGetAuditLogs
};
