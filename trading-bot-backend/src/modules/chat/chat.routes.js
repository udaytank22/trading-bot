const express = require('express');
const router = express.Router();
const chatController = require('./chat.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkPermission } = require('../../middleware/permission.middleware');

router.use(authMiddleware);

router.get('/users', checkPermission('chat', 'read'), chatController.getUsers);
router.get('/messages/:userId', checkPermission('chat', 'read'), chatController.getMessages);

module.exports = router;