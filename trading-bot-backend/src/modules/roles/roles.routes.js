const express = require('express');
const router = express.Router();
const controller = require('./roles.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkPermission } = require('../../middleware/permission.middleware');
const validate = require('../../middleware/validation.middleware');
const { validateCreateRole, validateUpdateRole } = require('./roles.validation');
const asyncWrapper = require('../../utils/asyncWrapper');

// All role routes are protected and managed under settings module permissions
router.use(authMiddleware);

router.get('/', checkPermission('settings', 'read'), asyncWrapper(controller.getRoles));
router.get('/:id', checkPermission('settings', 'read'), asyncWrapper(controller.getRole));
router.post('/', checkPermission('settings', 'create'), validate(validateCreateRole), asyncWrapper(controller.createRole));
router.put('/:id', checkPermission('settings', 'update'), validate(validateUpdateRole), asyncWrapper(controller.updateRole));
router.delete('/:id', checkPermission('settings', 'delete'), asyncWrapper(controller.deleteRole));

module.exports = router;
