const service = require('./roles.service');
const { sendSuccess, sendError } = require('../../utils/response');


/**
 * Get all roles
 */
const getRoles = async (req, res) => {
  const roles = await service.getAllRoles();
  return sendSuccess(res, 'Roles retrieved successfully', roles);
};

/**
 * Get role by ID
 */
const getRole = async (req, res) => {
  const role = await service.getRoleById(req.params.id);
  if (!role) {
    return sendError(res, 'Role not found', [], 404);
  }
  return sendSuccess(res, 'Role retrieved successfully', role);
};

/**
 * Create a new role
 */
const createRole = async (req, res) => {
  const { name, permissionIds } = req.body;
  const role = await service.createRole(name, permissionIds);

  

  return sendSuccess(res, 'Role created successfully', role, 201);
};

/**
 * Update role permissions
 */
const updateRole = async (req, res) => {
  const oldRole = await service.getRoleById(req.params.id);
  if (!oldRole) {
    return sendError(res, 'Role not found', [], 404);
  }

  const { permissionIds } = req.body;
  const role = await service.updateRolePermissions(req.params.id, permissionIds);

  

  return sendSuccess(res, 'Role permissions updated successfully', role);
};

/**
 * Delete a role
 */
const deleteRole = async (req, res) => {
  const oldRole = await service.getRoleById(req.params.id);
  if (!oldRole) {
    return sendError(res, 'Role not found', [], 404);
  }

  await service.deleteRole(req.params.id);

  

  return sendSuccess(res, 'Role deleted successfully');
};

module.exports = {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole
};
