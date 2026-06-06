const express = require('express');
const router = express.Router();
const outlookController = require('./outlook.controller');
const authMiddleware = require('../../middleware/auth.middleware');

router.get('/auth-url', authMiddleware, outlookController.getAuthUrl);
router.get('/callback', outlookController.callback);
router.get('/emails', authMiddleware, outlookController.getEmails);
router.get('/emails/:id', authMiddleware, outlookController.getEmailById);

module.exports = router;
