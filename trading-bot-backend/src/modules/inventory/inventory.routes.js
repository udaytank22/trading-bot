const express = require('express');
const router = express.Router();
const controller = require('./inventory.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkPermission } = require('../../middleware/permission.middleware');
const validate = require('../../middleware/validation.middleware');
const { validateCreateItem, validateMovement } = require('./inventory.validation');
const asyncWrapper = require('../../utils/asyncWrapper');

// Protect all routes
router.use(authMiddleware);

router.get('/', checkPermission('inventory', 'read'), asyncWrapper(controller.getItems));
router.get('/:id', checkPermission('inventory', 'read'), asyncWrapper(controller.getItem));
router.post('/', checkPermission('inventory', 'create'), validate(validateCreateItem), asyncWrapper(controller.createItem));
router.put('/:id', checkPermission('inventory', 'update'), asyncWrapper(controller.updateItem));
router.delete('/:id', checkPermission('inventory', 'delete'), asyncWrapper(controller.deleteItem));
router.post('/movements', checkPermission('inventory', 'update'), validate(validateMovement), asyncWrapper(controller.moveStock));

module.exports = router;
