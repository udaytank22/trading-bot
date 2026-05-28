const express = require('express');
const router = express.Router();
const controller = require('./quotations.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkPermission } = require('../../middleware/permission.middleware');
const validate = require('../../middleware/validation.middleware');
const { validateGetQuotation } = require('./quotations.validation');
const asyncWrapper = require('../../utils/asyncWrapper');

// All routes are protected
router.use(authMiddleware);

router.get('/', checkPermission('inquiries', 'read'), asyncWrapper(controller.getQuotations));
router.get('/:id', checkPermission('inquiries', 'read'), validate(validateGetQuotation), asyncWrapper(controller.getQuotation));

module.exports = router;
