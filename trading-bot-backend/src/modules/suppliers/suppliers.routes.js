const express = require('express');
const router = express.Router();
const controller = require('./suppliers.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkPermission } = require('../../middleware/permission.middleware');
const validate = require('../../middleware/validation.middleware');
const { validateCreateSupplier, validateUpdateSupplier } = require('./suppliers.validation');
const asyncWrapper = require('../../utils/asyncWrapper');

// All supplier routes are protected
router.use(authMiddleware);

router.get('/', checkPermission('suppliers', 'read'), asyncWrapper(controller.getSuppliers));
router.get('/:id', checkPermission('suppliers', 'read'), asyncWrapper(controller.getSupplier));
router.post('/bulk', checkPermission('suppliers', 'create'), asyncWrapper(controller.bulkImportSuppliers));
router.post('/', checkPermission('suppliers', 'create'), validate(validateCreateSupplier), asyncWrapper(controller.createSupplier));
router.put('/:id', checkPermission('suppliers', 'update'), validate(validateUpdateSupplier), asyncWrapper(controller.updateSupplier));
router.delete('/:id', checkPermission('suppliers', 'delete'), asyncWrapper(controller.deleteSupplier));

module.exports = router;
