const prisma = require('../../prisma/client');
const bcrypt = require('bcryptjs');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/token');

/**
 * Handle user login
 */
const login = async (email, password) => {
  const user = await prisma.user.findFirst({
    where: {
      email,
      isActive: true,
      deletedAt: null
    },
    include: {
      role: true
    }
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    throw new Error('Invalid email or password');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken }
  });

  const { password: p, refreshToken: r, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken
  };
};

/**
 * Issue new access/refresh tokens using a valid refresh token
 */
const refreshSession = async (token) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    throw new Error('Invalid or expired refresh token');
  }

  const user = await prisma.user.findFirst({
    where: {
      id: decoded.userId,
      refreshToken: token,
      isActive: true,
      deletedAt: null
    },
    include: {
      role: true
    }
  });

  if (!user) {
    throw new Error('Session expired or user deactivated');
  }

  const accessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: newRefreshToken }
  });

  return {
    accessToken,
    refreshToken: newRefreshToken
  };
};

/**
 * Log out user by clearing the stored refresh token
 */
const logout = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null }
  });
  return true;
};

/**
 * Update user password
 */
const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    throw new Error('Incorrect current password');
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword }
  });
  
  return true;
};

module.exports = {
  login,
  refreshSession,
  logout,
  changePassword
};
