const service = require('./permissions.service');
const { sendSuccess } = require('../../utils/response');

/**
 * Fetch all system permissions
 */
const getPermissions = async (req, res) => {
  const permissions = await service.getAllPermissions();
  return sendSuccess(res, 'Permissions retrieved successfully', permissions);
};

module.exports = {
  getPermissions
};
