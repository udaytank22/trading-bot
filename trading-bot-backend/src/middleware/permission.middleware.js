const prisma = require('../prisma/client');
const { sendError } = require('../utils/response');

/**
 * Middleware to check if user has permission for a specific module and action
 */
const checkPermission = (module, action) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return sendError(res, 'Authentication required before permission check', [], 401);
      }

      // Bypass for Super Admin
      if (user.role && user.role.name === 'Super Admin') {
        return next();
      }

      // Check if permission is assigned to user's role using cached user data
      let hasPermission = false;
      if (user.role && user.role.permissions) {
        hasPermission = user.role.permissions.some(rp => 
          rp.permission && 
          rp.permission.module === module && 
          rp.permission.action === action && 
          rp.permission.isActive === true
        );
      }

      if (!hasPermission) {
        return sendError(
          res,
          `Access Denied: Required permission [${module}:${action}] not granted for your role`,
          [],
          403
        );
      }

      next();
    } catch (error) {
      return sendError(res, 'Permission verification error', error.message, 500);
    }
  };
};

module.exports = {
  checkPermission
};