const express = require('express');
const router = express.Router();
const controller = require('./products.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkPermission } = require('../../middleware/permission.middleware');
const validate = require('../../middleware/validation.middleware');
const { validateCreateProduct, validateUpdateProduct } = require('./products.validation');
const asyncWrapper = require('../../utils/asyncWrapper');

// All product routes are protected
router.use(authMiddleware);

router.get('/', checkPermission('products', 'read'), asyncWrapper(controller.getProducts));
router.get('/:id', checkPermission('products', 'read'), asyncWrapper(controller.getProduct));
router.post('/', checkPermission('products', 'create'), validate(validateCreateProduct), asyncWrapper(controller.createProduct));
router.put('/:id', checkPermission('products', 'update'), validate(validateUpdateProduct), asyncWrapper(controller.updateProduct));
router.delete('/:id', checkPermission('products', 'delete'), asyncWrapper(controller.deleteProduct));

module.exports = router;
