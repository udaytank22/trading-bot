const express = require('express');
const router = express.Router();
const controller = require('./vehicles.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validation.middleware');
const { validateCreateVehicle, validateUpdateVehicle } = require('./vehicles.validation');
const asyncWrapper = require('../../utils/asyncWrapper');

// Assuming vehicles management is open for logged in users in this basic implementation
router.use(authMiddleware);

router.get('/', asyncWrapper(controller.getVehicles));
router.get('/:id', asyncWrapper(controller.getVehicle));
router.post('/', validate(validateCreateVehicle), asyncWrapper(controller.createVehicle));
router.put('/:id', validate(validateUpdateVehicle), asyncWrapper(controller.updateVehicle));
router.delete('/:id', asyncWrapper(controller.deleteVehicle));

module.exports = router;
