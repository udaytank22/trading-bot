/**
 * Validation rules for Roles module
 */
const validateCreateRole = {
  body: (body) => {
    const errors = [];
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      errors.push('Role name is required and must be a string');
    }
    if (body.permissionIds && !Array.isArray(body.permissionIds)) {
      errors.push('permissionIds must be an array of strings');
    }
    return errors;
  }
};

const validateUpdateRole = {
  params: (params) => {
    const errors = [];
    if (!params.id || params.id.trim() === '') {
      errors.push('Role ID is required');
    }
    return errors;
  },
  body: (body) => {
    const errors = [];
    if (!body.permissionIds || !Array.isArray(body.permissionIds)) {
      errors.push('permissionIds is required and must be an array of permission IDs');
    }
    return errors;
  }
};

module.exports = {
  validateCreateRole,
  validateUpdateRole
};
