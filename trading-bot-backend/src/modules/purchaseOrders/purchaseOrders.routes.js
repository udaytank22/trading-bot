const express = require('express');
const router = express.Router();
const controller = require('./purchaseOrders.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkPermission } = require('../../middleware/permission.middleware');
const validate = require('../../middleware/validation.middleware');
const { validateCreatePO, validateUpdatePO } = require('./purchaseOrders.validation');
const asyncWrapper = require('../../utils/asyncWrapper');

// Protect all routes
router.use(authMiddleware);

router.get('/', checkPermission('purchaseOrders', 'read'), asyncWrapper(controller.getPurchaseOrders));
router.get('/:id', checkPermission('purchaseOrders', 'read'), asyncWrapper(controller.getPurchaseOrder));
router.post('/', checkPermission('purchaseOrders', 'create'), validate(validateCreatePO), asyncWrapper(controller.createPurchaseOrder));
router.put('/:id', checkPermission('purchaseOrders', 'update'), validate(validateUpdatePO), asyncWrapper(controller.updatePurchaseOrder));
router.delete('/:id', checkPermission('purchaseOrders', 'delete'), asyncWrapper(controller.deletePurchaseOrder));
router.post('/:id/send-email', checkPermission('purchaseOrders', 'approve'), asyncWrapper(controller.sendEmail));

module.exports = router;
