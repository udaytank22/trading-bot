const prisma = require('../../prisma/client');

/**
 * Get all permissions
 */
const getAllPermissions = async () => {
  return await prisma.permission.findMany({
    orderBy: [
      { module: 'asc' },
      { action: 'asc' }
    ]
  });
};

module.exports = {
  getAllPermissions
};
