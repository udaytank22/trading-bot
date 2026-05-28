const express = require('express');
const router = express.Router();
const controller = require('./notifications.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validation.middleware');
const { validateIdParam } = require('./notifications.validation');
const asyncWrapper = require('../../utils/asyncWrapper');

// All notification routes are protected
router.use(authMiddleware);

router.get('/', asyncWrapper(controller.getNotifications));
router.put('/mark-all-read', asyncWrapper(controller.markAllRead));
router.put('/:id/mark-read', validate(validateIdParam), asyncWrapper(controller.markRead));
router.delete('/:id', validate(validateIdParam), asyncWrapper(controller.deleteNotification));

module.exports = router;
