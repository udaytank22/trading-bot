/**
 * Validation rules for Employees module
 */
const validateCreateEmployee = {
  body: (body) => {
    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!body.fullName || typeof body.fullName !== 'string' || body.fullName.trim() === '') {
      errors.push('fullName is required');
    }
    if (!body.email || !emailRegex.test(body.email)) {
      errors.push('A valid email address is required');
    }
    return errors;
  }
};

const validateAttendance = {
  body: (body) => {
    const errors = [];
    const validStatuses = ['PRESENT', 'LATE', 'SICK_LEAVE', 'OFF_DAY'];
    if (!body.status || !validStatuses.includes(body.status)) {
      errors.push(`status is required and must be one of: ${validStatuses.join(', ')}`);
    }
    return errors;
  }
};

module.exports = {
  validateCreateEmployee,
  validateAttendance
};
