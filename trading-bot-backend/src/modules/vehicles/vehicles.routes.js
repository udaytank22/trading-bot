const express = require('express');
const router = express.Router();
const controller = require('./vehicles.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkPermission } = require('../../middleware/permission.middleware');
const validate = require('../../middleware/validation.middleware');
const { validateCreateVehicle, validateUpdateVehicle } = require('./vehicles.validation');
const asyncWrapper = require('../../utils/asyncWrapper');

router.use(authMiddleware);

router.get('/', checkPermission('vehicles', 'read'), asyncWrapper(controller.getVehicles));
router.get('/:id', checkPermission('vehicles', 'read'), asyncWrapper(controller.getVehicle));
router.post('/bulk', checkPermission('vehicles', 'create'), asyncWrapper(controller.bulkImportVehicles));
router.post('/', checkPermission('vehicles', 'create'), validate(validateCreateVehicle), asyncWrapper(controller.createVehicle));
router.put('/:id', checkPermission('vehicles', 'update'), validate(validateUpdateVehicle), asyncWrapper(controller.updateVehicle));
router.delete('/:id', checkPermission('vehicles', 'delete'), asyncWrapper(controller.deleteVehicle));

module.exports = router;