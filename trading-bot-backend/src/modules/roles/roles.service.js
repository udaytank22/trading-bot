const prisma = require('../../prisma/client');
const { invalidateAllUserCaches } = require('../../utils/cache');

/**
 * Get all active roles with their associated permissions
 */
const getAllRoles = async () => {
  return await prisma.role.findMany({
    where: { deletedAt: null },
    include: {
      permissions: {
        include: {
          permission: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });
};

/**
 * Get role details by ID
 */
const getRoleById = async (id) => {
  return await prisma.role.findFirst({
    where: { id, deletedAt: null },
    include: {
      permissions: {
        include: {
          permission: true
        }
      }
    }
  });
};

/**
 * Create a new role with optional permission IDs
 */
const createRole = async (name, permissionIds = []) => {
  return await prisma.$transaction(async (tx) => {
    const role = await tx.role.create({
      data: { name }
    });

    if (permissionIds.length > 0) {
      await tx.rolePermission.createMany({
        data: permissionIds.map((permId) => ({
          roleId: role.id,
          permissionId: permId
        }))
      });
    }

    return await tx.role.findUnique({
      where: { id: role.id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });
  });
};

/**
 * Update permission matrix for a role
 */
const updateRolePermissions = async (id, permissionIds = []) => {
  return await prisma.$transaction(async (tx) => {
    const role = await tx.role.findFirst({
      where: { id }
    });

    if (!role) {
      throw new Error('Role not found');
    }

    if (role.name === 'Admin') {
      throw new Error('Admin permissions are locked and cannot be modified');
    }

    // Clear existing permissions
    await tx.rolePermission.deleteMany({
      where: { roleId: id }
    });

    // Bind new permissions
    if (permissionIds.length > 0) {
      await tx.rolePermission.createMany({
        data: permissionIds.map((permId) => ({
          roleId: id,
          permissionId: permId
        }))
      });
    }

    const updatedRole = await tx.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });
    
    invalidateAllUserCaches();
    
    return updatedRole;
  });
};

/**
 * Soft delete a role
 */
const deleteRole = async (id) => {
  const role = await prisma.role.findFirst({
    where: { id }
  });

  if (!role) {
    throw new Error('Role not found');
  }

  if (role.name === 'Admin' || role.name === 'Employee') {
    throw new Error(`Core role '${role.name}' cannot be deleted`);
  }

  const updatedRole = await prisma.role.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false
    }
  });

  invalidateAllUserCaches();

  return updatedRole;
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRolePermissions,
  deleteRole
};
