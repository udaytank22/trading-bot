const express = require('express');
const router = express.Router();
const controller = require('./users.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkPermission } = require('../../middleware/permission.middleware');
const validate = require('../../middleware/validation.middleware');
const { validateCreateUser, validateUpdateUser } = require('./users.validation');
const asyncWrapper = require('../../utils/asyncWrapper');

// All user routes are protected under settings role-based access
router.use(authMiddleware);

router.get('/', checkPermission('settings', 'read'), asyncWrapper(controller.getUsers));
router.get('/:id', checkPermission('settings', 'read'), asyncWrapper(controller.getUser));
router.post('/', checkPermission('settings', 'create'), validate(validateCreateUser), asyncWrapper(controller.createUser));
router.put('/:id', checkPermission('settings', 'update'), validate(validateUpdateUser), asyncWrapper(controller.updateUser));
router.delete('/:id', checkPermission('settings', 'delete'), asyncWrapper(controller.deleteUser));

module.exports = router;
