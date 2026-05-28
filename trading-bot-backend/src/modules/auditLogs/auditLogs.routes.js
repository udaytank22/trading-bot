const express = require('express');
const router = express.Router();
const controller = require('./auditLogs.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkPermission } = require('../../middleware/permission.middleware');
const validate = require('../../middleware/validation.middleware');
const { validateGetAuditLogs } = require('./auditLogs.validation');
const asyncWrapper = require('../../utils/asyncWrapper');

router.get(
  '/',
  authMiddleware,
  checkPermission('reports', 'read'), // Protected under reports permission
  validate(validateGetAuditLogs),
  asyncWrapper(controller.getAuditLogs)
);

module.exports = router;
