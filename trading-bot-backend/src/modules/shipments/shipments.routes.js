const express = require('express');
const router = express.Router();
const controller = require('./shipments.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkPermission } = require('../../middleware/permission.middleware');
const validate = require('../../middleware/validation.middleware');
const { validateCreateShipment, validateUpdateShipment } = require('./shipments.validation');
const asyncWrapper = require('../../utils/asyncWrapper');

// Protect all routes
router.use(authMiddleware);

router.get('/', checkPermission('shipments', 'read'), asyncWrapper(controller.getShipments));
router.get('/:id', checkPermission('shipments', 'read'), asyncWrapper(controller.getShipment));
router.post('/', checkPermission('shipments', 'create'), validate(validateCreateShipment), asyncWrapper(controller.createShipment));
router.put('/:id', checkPermission('shipments', 'update'), validate(validateUpdateShipment), asyncWrapper(controller.updateShipment));
router.delete('/:id', checkPermission('shipments', 'delete'), asyncWrapper(controller.deleteShipment));

module.exports = router;
