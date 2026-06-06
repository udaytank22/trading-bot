const express = require('express');
const router = express.Router();
const chatController = require('./chat.controller');
const authMiddleware = require('../../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/users', chatController.getUsers);
router.get('/messages/:userId', chatController.getMessages);

module.exports = router;
