const rateLimit = require('express-rate-limit');
const config = require('../config');

// Global rate limiter applied to all /api routes
const globalLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_GLOBAL_WINDOW_MS,
  max: config.RATE_LIMIT_GLOBAL_MAX,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limiter for sensitive endpoints
const strictLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_STRICT_WINDOW_MS,
  max: config.RATE_LIMIT_STRICT_MAX,
  message: {
    success: false,
    message: 'Too many requests for this specific resource, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  globalLimiter,
  strictLimiter
};
