require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'trademind_super_secret_access_key_9988',
  REFRESH_SECRET: process.env.REFRESH_SECRET || 'trademind_super_secret_refresh_key_1122',
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  DATABASE_URL: process.env.DATABASE_URL,
  OUTLOOK_CLIENT_ID: process.env.OUTLOOK_CLIENT_ID,
  OUTLOOK_CLIENT_SECRET: process.env.OUTLOOK_CLIENT_SECRET,
  OUTLOOK_REDIRECT_URI: process.env.OUTLOOK_REDIRECT_URI || 'http://localhost:5000/api/outlook/callback',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:5000', 'http://localhost:5173'],
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS ? Number(process.env.RATE_LIMIT_WINDOW_MS) : 60000,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX ? Number(process.env.RATE_LIMIT_MAX) : 200,
  STRICT_RATE_LIMIT_WINDOW_MS: process.env.STRICT_RATE_LIMIT_WINDOW_MS ? Number(process.env.STRICT_RATE_LIMIT_WINDOW_MS) : 60000,
  STRICT_RATE_LIMIT_MAX: process.env.STRICT_RATE_LIMIT_MAX ? Number(process.env.STRICT_RATE_LIMIT_MAX) : 10
};