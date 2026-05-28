const jwt = require('jsonwebtoken');
const config = require('../config');

const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role ? user.role.name : '' 
    },
    config.JWT_SECRET,
    { expiresIn: config.ACCESS_TOKEN_EXPIRY }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user.id },
    config.REFRESH_SECRET,
    { expiresIn: config.REFRESH_TOKEN_EXPIRY }
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, config.JWT_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.REFRESH_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
