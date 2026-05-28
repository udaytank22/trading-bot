const express = require('express');
const router = express.Router();
const controller = require('./auth.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validation.middleware');
const { validateLogin, validateRefresh, validateChangePassword } = require('./auth.validation');
const asyncWrapper = require('../../utils/asyncWrapper');
const rateLimit = require('express-rate-limit');

// Rate limiter for authentication attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 attempts
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Unprotected routes
router.post('/login', authLimiter, validate(validateLogin), asyncWrapper(controller.login));
router.post('/refresh', validate(validateRefresh), asyncWrapper(controller.refresh));

// Protected routes
router.post('/logout', authMiddleware, asyncWrapper(controller.logout));
router.get('/me', authMiddleware, asyncWrapper(controller.me));
router.post('/change-password', authMiddleware, validate(validateChangePassword), asyncWrapper(controller.changePassword));

module.exports = router;
