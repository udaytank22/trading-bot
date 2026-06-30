const prisma = require('../../prisma/client');
const bcrypt = require('bcryptjs');
const { invalidateUserCache } = require('../../utils/cache');

const { getPaginationParams } = require('../../utils/queryHelper');

/**
 * Get all users who are not deleted
 */
const getAllUsers = async (query = {}) => {
  const where = { deletedAt: null };
  const { skip, take } = getPaginationParams(query);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        role: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    }),
    prisma.user.count({ where })
  ]);

  return { data: users, total };
};

/**
 * Get a user by ID
 */
const getUserById = async (id) => {
  return await prisma.user.findFirst({
    where: { id, deletedAt: null },
    include: {
      role: true
    }
  });
};

/**
 * Create a new user with hashed password
 */
const createUser = async (data, creatorId) => {
  // Check for duplicate user (by email)
  const existingUser = await prisma.user.findFirst({
    where: {
      email: data.email,
      deletedAt: null
    }
  });

  if (existingUser) {
    const err = new Error('A user with this email already exists.');
    err.statusCode = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  return await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      roleId: data.roleId,
      createdById: creatorId,
      isActive: data.isActive !== undefined ? data.isActive : true
    },
    include: {
      role: true
    }
  });
};

/**
 * Update user details
 */
const updateUser = async (id, data, updaterId) => {
  // Check for duplicate user (by email) excluding the current user
  if (data.email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        id: { not: id },
        email: data.email,
        deletedAt: null
      }
    });

    if (existingUser) {
      const err = new Error('A user with this email already exists.');
      err.statusCode = 400;
      throw err;
    }
  }

  const updateData = {
    updatedById: updaterId
  };

  if (data.email) updateData.email = data.email;
  if (data.roleId) updateData.roleId = data.roleId;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    include: {
      role: true
    }
  });
  invalidateUserCache(id);
  return user;
};

/**
 * Soft delete a user
 */
const deleteUser = async (id, deleterId) => {
  const user = await prisma.user.findFirst({
    where: { id },
    include: { role: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.role && user.role.name === 'Super Admin') {
    throw new Error('Super Admin user cannot be deleted');
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
      updatedById: deleterId
    }
  });
  invalidateUserCache(id);
  return updatedUser;
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
