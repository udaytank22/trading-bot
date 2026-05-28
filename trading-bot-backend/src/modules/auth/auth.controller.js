const service = require('./auth.service');
const { sendSuccess, sendError } = require('../../utils/response');
const { createAuditLog } = require('../auditLogs/auditLogs.service');

/**
 * Log in controller
 */
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const data = await service.login(email, password);

    // Audit log
    await createAuditLog({
      userId: data.user.id,
      module: 'auth',
      action: 'login',
      recordId: data.user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, 'Login successful', data);
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};

/**
 * Refresh token controller
 */
const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  try {
    const data = await service.refreshSession(refreshToken);
    return sendSuccess(res, 'Token refreshed successfully', data);
  } catch (error) {
    return sendError(res, error.message, [], 401);
  }
};

/**
 * Logout controller
 */
const logout = async (req, res) => {
  await service.logout(req.user.id);

  // Audit log
  await createAuditLog({
    userId: req.user.id,
    module: 'auth',
    action: 'logout',
    recordId: req.user.id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return sendSuccess(res, 'Logged out successfully');
};

/**
 * Get currently logged-in user info
 */
const me = async (req, res) => {
  const { password, refreshToken, ...data } = req.user;
  return sendSuccess(res, 'User profile retrieved successfully', data);
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    await service.changePassword(req.user.id, oldPassword, newPassword);

    await createAuditLog({
      userId: req.user.id,
      module: 'auth',
      action: 'change password',
      recordId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, 'Password updated successfully');
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};

module.exports = {
  login,
  refresh,
  logout,
  me,
  changePassword
};
