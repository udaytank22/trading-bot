const express = require('express');
const router = express.Router();
const controller = require('./permissions.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkPermission } = require('../../middleware/permission.middleware');
const asyncWrapper = require('../../utils/asyncWrapper');

router.get(
  '/',
  authMiddleware,
  checkPermission('settings', 'read'), // Mapped to settings:read
  asyncWrapper(controller.getPermissions)
);

module.exports = router;
