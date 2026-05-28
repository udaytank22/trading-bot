const express = require('express');
const router = express.Router();
const controller = require('./inquiries.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const { checkPermission } = require('../../middleware/permission.middleware');
const validate = require('../../middleware/validation.middleware');
const {
  validateCreateInquiry,
  validateUpdateInquiry,
  validateStockCheck,
  validateSupplierQuote,
  validateClientQuote,
  validateApproval,
  validateClientDecision
} = require('./inquiries.validation');
const asyncWrapper = require('../../utils/asyncWrapper');

// All inquiry routes are protected
router.use(authMiddleware);

// Standard CRUD
router.get('/', checkPermission('inquiries', 'read'), asyncWrapper(controller.getInquiries));
router.get('/:id', checkPermission('inquiries', 'read'), asyncWrapper(controller.getInquiry));
router.post('/', checkPermission('inquiries', 'create'), validate(validateCreateInquiry), asyncWrapper(controller.createInquiry));
router.put('/:id', checkPermission('inquiries', 'update'), validate(validateUpdateInquiry), asyncWrapper(controller.updateInquiry));
router.delete('/:id', checkPermission('inquiries', 'delete'), asyncWrapper(controller.deleteInquiry));

// Action APIs
router.post('/:id/stock-check', checkPermission('inquiries', 'approve'), validate(validateStockCheck), asyncWrapper(controller.stockCheck));
router.post('/:id/send-rfq', checkPermission('inquiries', 'approve'), asyncWrapper(controller.sendRFQ));
router.post('/:id/supplier-quote', checkPermission('inquiries', 'approve'), validate(validateSupplierQuote), asyncWrapper(controller.supplierQuote));
router.post('/:id/client-quote', checkPermission('inquiries', 'approve'), validate(validateClientQuote), asyncWrapper(controller.clientQuote));
router.post('/:id/team-lead-approve', checkPermission('inquiries', 'approve'), validate(validateApproval), asyncWrapper(controller.teamLeadApprove));
router.post('/:id/admin-approve', checkPermission('inquiries', 'approve'), validate(validateApproval), asyncWrapper(controller.adminApprove));
router.post('/:id/final-verify', checkPermission('inquiries', 'approve'), asyncWrapper(controller.finalVerify));
router.post('/:id/client-decision', checkPermission('inquiries', 'approve'), validate(validateClientDecision), asyncWrapper(controller.clientDecision));
router.post('/:id/confirm-deal', checkPermission('inquiries', 'approve'), asyncWrapper(controller.confirmDeal));
router.post('/:id/close', checkPermission('inquiries', 'approve'), asyncWrapper(controller.close));

module.exports = router;
