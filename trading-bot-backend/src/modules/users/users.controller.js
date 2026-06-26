const service = require('./users.service');
const { sendSuccess, sendError } = require('../../utils/response');


/**
 * Get all users
 */
const getUsers = async (req, res) => {
  const users = await service.getAllUsers();
  
  // Format to never return password hash
  const data = users.map((u) => {
    const { password, refreshToken, ...rest } = u;
    return rest;
  });

  return sendSuccess(res, 'Users list retrieved successfully', data);
};

/**
 * Get user by ID
 */
const getUser = async (req, res) => {
  const user = await service.getUserById(req.params.id);
  if (!user) {
    return sendError(res, 'User not found', [], 404);
  }

  const { password, refreshToken, ...data } = user;
  return sendSuccess(res, 'User details retrieved successfully', data);
};

/**
 * Create a new user
 */
const createUser = async (req, res) => {
  const user = await service.createUser(req.body, req.user.id);
  const { password, refreshToken, ...data } = user;

  

  return sendSuccess(res, 'User created successfully', data, 201);
};

/**
 * Update user details
 */
const updateUser = async (req, res) => {
  const oldUser = await service.getUserById(req.params.id);
  if (!oldUser) {
    return sendError(res, 'User not found', [], 404);
  }

  const user = await service.updateUser(req.params.id, req.body, req.user.id);
  const { password, refreshToken, ...data } = user;
  const { password: p, refreshToken: r, ...oldData } = oldUser;

  

  return sendSuccess(res, 'User updated successfully', data);
};

/**
 * Delete a user
 */
const deleteUser = async (req, res) => {
  const oldUser = await service.getUserById(req.params.id);
  if (!oldUser) {
    return sendError(res, 'User not found', [], 404);
  }

  await service.deleteUser(req.params.id, req.user.id);
  const { password, refreshToken, ...oldData } = oldUser;

  

  return sendSuccess(res, 'User deleted successfully');
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
};
