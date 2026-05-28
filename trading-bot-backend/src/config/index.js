require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'trademind_super_secret_access_key_9988',
  REFRESH_SECRET: process.env.REFRESH_SECRET || 'trademind_super_secret_refresh_key_1122',
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  DATABASE_URL: process.env.DATABASE_URL
};
