const service = require('./auth.service');
const { sendSuccess, sendError } = require('../../utils/response');


/**
 * Log in controller
 */
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const data = await service.login(email, password);

    // Issue httpOnly cookie
    res.cookie('refreshToken', data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    const { refreshToken, ...responseData } = data;

    // Audit log
    

    return sendSuccess(res, 'Login successful', responseData);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return sendError(res, error.message, [], statusCode);
  }
};

/**
 * Refresh token controller
 */
const refresh = async (req, res) => {
  // Read from cookie instead of body
  const refreshToken = req.cookies?.refreshToken;
  
  if (!refreshToken) {
    return sendError(res, 'No refresh token provided', [], 401);
  }

  try {
    const data = await service.refreshSession(refreshToken);

    // Issue new httpOnly cookie
    res.cookie('refreshToken', data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    const { refreshToken: removedToken, ...responseData } = data;

    return sendSuccess(res, 'Token refreshed successfully', responseData);
  } catch (error) {
    return sendError(res, error.message, [], 401);
  }
};

/**
 * Logout controller
 */
const logout = async (req, res) => {
  await service.logout(req.user.id);
  res.clearCookie('refreshToken');

  // Audit log
  

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
