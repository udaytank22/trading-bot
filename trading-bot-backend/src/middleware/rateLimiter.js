const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Extracts userId from the request (from Authorization header or refresh token body or req.user)
 */
const getUserIdFromRequest = (req) => {
  // 1. Try extracting from Authorization header (Access Token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.JWT_SECRET);
      if (decoded && decoded.userId) {
        return decoded.userId;
      }
    } catch (err) {
      // ignore
    }
  }

  // 2. Try extracting from body.refreshToken (Refresh Token)
  if (req.body && req.body.refreshToken) {
    try {
      const decoded = jwt.verify(req.body.refreshToken, config.REFRESH_SECRET);
      if (decoded && decoded.userId) {
        return decoded.userId;
      }
    } catch (err) {
      // ignore
    }
  }

  // 3. Try fallback to req.user populated by authMiddleware
  if (req.user && req.user.id) {
    return req.user.id;
  }

  return 'anonymous';
};

/**
 * Common key generator that combines Client IP and User ID (if authenticated)
 */
const rateLimitKeyGenerator = (req) => {
  const userId = getUserIdFromRequest(req);
  return `${req.ip}-${userId}`;
};

/**
 * Sensible default rate limiter applied to all API endpoints
 */
const globalLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  keyGenerator: rateLimitKeyGenerator,
  message: {
    success: false,
    message: 'Too many requests. Please slow down and try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Stricter rate limiter for expensive or sensitive endpoints (e.g., refresh token, PDF generation)
 */
const stricterLimiter = rateLimit({
  windowMs: config.STRICT_RATE_LIMIT_WINDOW_MS,
  max: config.STRICT_RATE_LIMIT_MAX,
  keyGenerator: rateLimitKeyGenerator,
  message: {
    success: false,
    message: 'Too many requests to this high-resource endpoint. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  globalLimiter,
  stricterLimiter
};
