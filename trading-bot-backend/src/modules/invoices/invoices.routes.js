const express = require('express');
const router = express.Router();
const controller = require('./invoices.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkPermission } = require('../../middleware/permission.middleware');
const validate = require('../../middleware/validation.middleware');
const { validateCreateInvoice, validateUpdateInvoice } = require('./invoices.validation');
const asyncWrapper = require('../../utils/asyncWrapper');
const { strictLimiter } = require('../../middleware/rateLimiter');

// Protect all routes
router.use(authMiddleware);

router.get('/', checkPermission('invoices', 'read'), asyncWrapper(controller.getInvoices));
router.get('/:id', checkPermission('invoices', 'read'), asyncWrapper(controller.getInvoice));
router.get('/:id/pdf', strictLimiter, checkPermission('invoices', 'read'), asyncWrapper(controller.downloadInvoicePdf));
router.get('/:id/preview', checkPermission('invoices', 'read'), asyncWrapper(controller.previewInvoice));
router.post('/', checkPermission('invoices', 'create'), validate(validateCreateInvoice), asyncWrapper(controller.createInvoice));
router.post('/generate/shipment/:shipmentId', checkPermission('invoices', 'create'), asyncWrapper(controller.generateInvoiceFromShipment));
router.post('/generate/inquiry', checkPermission('invoices', 'create'), asyncWrapper(controller.createInvoiceFromInquiry));
router.post('/:id/send', checkPermission('invoices', 'create'), asyncWrapper(controller.sendInvoiceEmail));
router.put('/:id', checkPermission('invoices', 'update'), validate(validateUpdateInvoice), asyncWrapper(controller.updateInvoice));
router.delete('/:id', checkPermission('invoices', 'delete'), asyncWrapper(controller.deleteInvoice));

module.exports = router;
