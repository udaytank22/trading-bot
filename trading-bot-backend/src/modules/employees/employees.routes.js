const express = require('express');
const router = express.Router();
const controller = require('./employees.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkPermission } = require('../../middleware/permission.middleware');
const validate = require('../../middleware/validation.middleware');
const { validateCreateEmployee, validateAttendance } = require('./employees.validation');
const asyncWrapper = require('../../utils/asyncWrapper');

// Protect all routes
router.use(authMiddleware);

router.get('/', checkPermission('employees', 'read'), asyncWrapper(controller.getEmployees));
router.get('/:id', checkPermission('employees', 'read'), asyncWrapper(controller.getEmployee));
router.post('/', checkPermission('employees', 'create'), validate(validateCreateEmployee), asyncWrapper(controller.createEmployee));
router.put('/:id', checkPermission('employees', 'update'), asyncWrapper(controller.updateEmployee));
router.delete('/:id', checkPermission('employees', 'delete'), asyncWrapper(controller.deleteEmployee));
router.post('/:id/attendance', checkPermission('employees', 'update'), validate(validateAttendance), asyncWrapper(controller.logAttendance));

module.exports = router;
