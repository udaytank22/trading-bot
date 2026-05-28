const express = require('express');
const router = express.Router();
const controller = require('./payments.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkPermission } = require('../../middleware/permission.middleware');
const validate = require('../../middleware/validation.middleware');
const { validateCreatePayment, validateDeletePayment } = require('./payments.validation');
const asyncWrapper = require('../../utils/asyncWrapper');

// Protect all routes
router.use(authMiddleware);

router.get('/', checkPermission('payments', 'read'), asyncWrapper(controller.getPayments));
router.get('/:id', checkPermission('payments', 'read'), asyncWrapper(controller.getPayment));
router.post('/', checkPermission('payments', 'create'), validate(validateCreatePayment), asyncWrapper(controller.createPayment));
router.delete('/:id', checkPermission('payments', 'delete'), validate(validateDeletePayment), asyncWrapper(controller.deletePayment));

module.exports = router;
