const service = require('./users.service');
const { sendSuccess, sendError } = require('../../utils/response');


/**
 * Get all users
 */
const getUsers = async (req, res) => {
  const { data, total } = await service.getAllUsers(req.query);
  
  // Format to never return password hash
  const formattedData = data.map((u) => {
    const { password, refreshToken, ...rest } = u;
    return rest;
  });

  const meta = {
    totalItems: total,
    currentPage: req.query.page ? parseInt(req.query.page) : 1,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize) : total,
    totalPages: req.query.pageSize ? Math.ceil(total / parseInt(req.query.pageSize)) : 1
  };

  return sendSuccess(res, 'Users list retrieved successfully', formattedData, 200, meta);
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
