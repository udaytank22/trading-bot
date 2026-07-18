const express = require('express');
const router = express.Router();
const emailController = require('./email.controller');
const authMiddleware = require('../../middleware/auth.middleware');

// Check if Gmail is configured
router.get('/auth-status', authMiddleware, emailController.getAuthStatus);

// Fetch inbox emails
router.get('/emails', authMiddleware, emailController.getEmails);

// Fetch single email by ID
router.get('/emails/:id', authMiddleware, emailController.getEmailById);

// Send a test email (for verifying SMTP setup)
router.post('/send-test', authMiddleware, emailController.sendTestEmail);

module.exports = router;
