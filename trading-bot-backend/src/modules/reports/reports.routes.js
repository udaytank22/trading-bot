const express = require('express');
const router = express.Router();
const controller = require('./reports.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkPermission } = require('../../middleware/permission.middleware');
const validate = require('../../middleware/validation.middleware');
const { validateDateFilter } = require('./reports.validation');
const asyncWrapper = require('../../utils/asyncWrapper');

// Protect all routes
router.use(authMiddleware);

router.get('/dashboard', checkPermission('dashboard', 'read'), asyncWrapper(controller.getDashboardStats));
router.get('/pipeline', checkPermission('reports', 'read'), asyncWrapper(controller.getPipelineReport));
router.get('/profit', checkPermission('reports', 'read'), validate(validateDateFilter), asyncWrapper(controller.getProfitReport));
router.get('/invoices', checkPermission('reports', 'read'), validate(validateDateFilter), asyncWrapper(controller.getInvoiceReport));
router.get('/payments', checkPermission('reports', 'read'), validate(validateDateFilter), asyncWrapper(controller.getPaymentReport));
router.get('/inventory', checkPermission('reports', 'read'), asyncWrapper(controller.getInventoryReport));
router.get('/employees', checkPermission('reports', 'read'), asyncWrapper(controller.getEmployeeReport));
router.get('/documents', checkPermission('reports', 'read'), asyncWrapper(controller.getDocumentExpiryReport));

module.exports = router;
