const service = require('./inquiries.service');
const { sendSuccess, sendError } = require('../../utils/response');
const { createAuditLog } = require('../auditLogs/auditLogs.service');
const { notifyAdmins, createNotification } = require('../notifications/notifications.service');

/**
 * Get all inquiries
 */
const getInquiries = async (req, res) => {
  const { data, total } = await service.getAllInquiries(req.query);
  const meta = {
    totalItems: total,
    currentPage: req.query.page ? parseInt(req.query.page) : 1,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize) : total,
    totalPages: req.query.pageSize ? Math.ceil(total / parseInt(req.query.pageSize)) : 1
  };
  return sendSuccess(res, 'Inquiries retrieved successfully', data, 200, meta);
};

/**
 * Get inquiry by ID
 */
const getInquiry = async (req, res) => {
  const inquiry = await service.getInquiryById(req.params.id);
  if (!inquiry) {
    return sendError(res, 'Inquiry not found', [], 404);
  }
  return sendSuccess(res, 'Inquiry details retrieved successfully', inquiry);
};

/**
 * Create a new inquiry (PENDING)
 */
const createInquiry = async (req, res) => {
  const inquiry = await service.createInquiry(req.body, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'inquiries',
    action: 'create',
    recordId: inquiry.id,
    newValue: inquiry,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  await notifyAdmins({
    title: 'New Inquiry Created',
    message: `Inquiry ${inquiry.inquiryNumber} has been received.`,
    type: 'inquiry',
    relatedModule: 'inquiries',
    relatedRecordId: inquiry.id
  });

  const fullInquiry = await service.getInquiryById(inquiry.id);
  return sendSuccess(res, 'Inquiry created successfully', fullInquiry, 201);
};

/**
 * Create a new inquiry publicly from portal (PENDING)
 */
const createPublicInquiry = async (req, res) => {
  const { inquiry, client, creatorId } = await service.createPublicInquiry(req.body);

  await createAuditLog({
    userId: creatorId,
    module: 'inquiries',
    action: 'create (public)',
    recordId: inquiry.id,
    newValue: inquiry,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  await notifyAdmins({
    title: 'New Public Inquiry Received',
    message: `Client ${client.name} (${client.company || 'No Company'}) submitted inquiry ${inquiry.inquiryNumber}.`,
    type: 'inquiry',
    relatedModule: 'inquiries',
    relatedRecordId: inquiry.id
  });

  const fullInquiry = await service.getInquiryById(inquiry.id);
  return sendSuccess(res, 'Inquiry created successfully from public portal', fullInquiry, 201);
};

/**
 * Update basic details
 */
const updateInquiry = async (req, res) => {
  const old = await service.getInquiryById(req.params.id);
  if (!old) {
    return sendError(res, 'Inquiry not found', [], 404);
  }

  const updated = await service.updateInquiry(req.params.id, req.body, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'inquiries',
    action: 'update',
    recordId: updated.id,
    oldValue: old,
    newValue: updated,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  const fullInquiry = await service.getInquiryById(updated.id);
  return sendSuccess(res, 'Inquiry updated successfully', fullInquiry);
};

/**
 * Delete inquiry (soft delete)
 */
const deleteInquiry = async (req, res) => {
  const old = await service.getInquiryById(req.params.id);
  if (!old) {
    return sendError(res, 'Inquiry not found', [], 404);
  }

  await service.deleteInquiry(req.params.id, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'inquiries',
    action: 'delete',
    recordId: req.params.id,
    oldValue: old,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return sendSuccess(res, 'Inquiry soft-deleted successfully');
};

/* ==========================================================================
   Pipeline Action Handlers
   ========================================================================== */

/**
 * 1. Stock check action handler
 */
const stockCheck = async (req, res) => {
  const updated = await service.stockCheck(req.params.id, req.body, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'inquiries',
    action: 'status change',
    recordId: updated.id,
    newValue: updated,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  await notifyAdmins({
    title: 'RFQ Ready',
    message: `Inquiry ${updated.inquiryNumber} stock checks completed. Status advanced to RFQ_READY.`,
    type: 'inquiry',
    relatedModule: 'inquiries',
    relatedRecordId: updated.id
  });

  const fullInquiry = await service.getInquiryById(updated.id);
  return sendSuccess(res, 'Stock verification recorded successfully', fullInquiry);
};

/**
 * 2. Send RFQ action handler
 */
const sendRFQ = async (req, res) => {
  const updated = await service.sendRFQ(req.params.id, req.body, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'inquiries',
    action: 'status change',
    recordId: updated.id,
    newValue: updated,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  await createNotification({
    userId: req.user.id,
    title: 'RFQ Dispatched',
    message: `Inquiry ${updated.inquiryNumber} status advanced to RFQ_SENT.`,
    type: 'inquiry',
    relatedModule: 'inquiries',
    relatedRecordId: updated.id
  });

  const fullInquiry = await service.getInquiryById(updated.id);
  return sendSuccess(res, 'RFQ status dispatched successfully', fullInquiry);
};

/**
 * 3. Receive supplier quote action handler
 */
const supplierQuote = async (req, res) => {
  const updated = await service.submitSupplierQuote(req.params.id, req.body, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'inquiries',
    action: 'status change',
    recordId: updated.id,
    newValue: updated,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  await createNotification({
    userId: req.user.id,
    title: 'Supplier Quote Logged',
    message: `A supplier quote has been linked to Inquiry ${updated.inquiryNumber}. Status is TL_REVIEW.`,
    type: 'inquiry',
    relatedModule: 'inquiries',
    relatedRecordId: updated.id
  });

  const fullInquiry = await service.getInquiryById(updated.id);
  return sendSuccess(res, 'Supplier quote saved successfully', fullInquiry);
};

/**
 * 4. Client quotation builder action handler
 */
const clientQuote = async (req, res) => {
  const updated = await service.submitClientQuote(req.params.id, req.body, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'inquiries',
    action: 'status change',
    recordId: updated.id,
    newValue: updated,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Notify Team Lead for review
  if (updated.assignedTeamLeadId) {
    await createNotification({
      userId: updated.assignedTeamLeadId,
      title: 'Quotation Awaiting Review',
      message: `Inquiry ${updated.inquiryNumber} pricing sheet has been built and requires your review.`,
      type: 'inquiry',
      relatedModule: 'inquiries',
      relatedRecordId: updated.id
    });
  } else {
    await notifyAdmins({
      title: 'Quotation Awaiting Review',
      message: `Inquiry ${updated.inquiryNumber} pricing sheet built and requires Team Lead review.`,
      type: 'inquiry',
      relatedModule: 'inquiries',
      relatedRecordId: updated.id
    });
  }

  const fullInquiry = await service.getInquiryById(updated.id);
  return sendSuccess(res, 'Client quotation draft generated', fullInquiry);
};

/**
 * 5. Team Lead Review action handler
 */
const teamLeadApprove = async (req, res) => {
  const updated = await service.teamLeadApprove(req.params.id, req.body, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'inquiries',
    action: 'approval',
    recordId: updated.id,
    newValue: updated,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  await notifyAdmins({
    title: req.body.approved ? 'TL Approved Deal' : 'TL Rejected Deal',
    message: `Team Lead has reviewed Inquiry ${updated.inquiryNumber}. Status is now ${updated.currentStatus}.`,
    type: 'inquiry',
    relatedModule: 'inquiries',
    relatedRecordId: updated.id
  });

  const fullInquiry = await service.getInquiryById(updated.id);
  return sendSuccess(res, 'Team Lead review recorded', fullInquiry);
};

/**
 * 6. Admin Approval action handler
 */
const adminApprove = async (req, res) => {
  const updated = await service.adminApprove(req.params.id, req.body, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'inquiries',
    action: 'approval',
    recordId: updated.id,
    newValue: updated,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  if (updated.assignedEmployeeId) {
    await createNotification({
      userId: updated.assignedEmployeeId,
      title: req.body.approved ? 'Admin Approved Deal' : 'Admin Rejected Deal',
      message: `Admin has finalized the approval for ${updated.inquiryNumber}. Status: ${updated.currentStatus}.`,
      type: 'inquiry',
      relatedModule: 'inquiries',
      relatedRecordId: updated.id
    });
  }

  const fullInquiry = await service.getInquiryById(updated.id);
  return sendSuccess(res, 'Admin approval recorded', fullInquiry);
};

/**
 * 7. Employee Verification action handler
 */
const finalVerify = async (req, res) => {
  const updated = await service.finalVerify(req.params.id, req.body, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'inquiries',
    action: 'status change',
    recordId: updated.id,
    newValue: updated,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  const fullInquiry = await service.getInquiryById(updated.id);
  return sendSuccess(res, 'Final verification logged. Dispatched to client.', fullInquiry);
};

/**
 * 8. Client Decision action handler
 */
const clientDecision = async (req, res) => {
  const updated = await service.clientDecision(req.params.id, req.body, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'inquiries',
    action: 'status change',
    recordId: updated.id,
    newValue: updated,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  await notifyAdmins({
    title: req.body.accepted ? 'Deal Accepted by Client' : 'Deal Declined by Client',
    message: `Client has responded to Inquiry ${updated.inquiryNumber}. Status is ${updated.currentStatus}.`,
    type: 'inquiry',
    relatedModule: 'inquiries',
    relatedRecordId: updated.id
  });

  const fullInquiry = await service.getInquiryById(updated.id);
  return sendSuccess(res, 'Client decision saved', fullInquiry);
};

/**
 * 9. Deal Confirmation action handler
 */
const confirmDeal = async (req, res) => {
  const updated = await service.confirmDeal(req.params.id, req.body, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'inquiries',
    action: 'status change',
    recordId: updated.id,
    newValue: updated,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  await notifyAdmins({
    title: 'Deal Confirmed!',
    message: `Inquiry ${updated.inquiryNumber} deal confirmed. PO and logistics generated.`,
    type: 'purchase-order',
    relatedModule: 'inquiries',
    relatedRecordId: updated.id
  });

  const fullInquiry = await service.getInquiryById(updated.id);
  return sendSuccess(res, 'Deal confirmed successfully', fullInquiry);
};

/**
 * 10. Close inquiry action handler
 */
const close = async (req, res) => {
  const updated = await service.closeInquiry(req.params.id, req.body, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'inquiries',
    action: 'status change',
    recordId: updated.id,
    newValue: updated,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  await createNotification({
    userId: req.user.id,
    title: 'Inquiry Closed',
    message: `Inquiry ${updated.inquiryNumber} has been successfully closed.`,
    type: 'inquiry',
    relatedModule: 'inquiries',
    relatedRecordId: updated.id
  });

  const fullInquiry = await service.getInquiryById(updated.id);
  return sendSuccess(res, 'Inquiry closed successfully', fullInquiry);
};

/**
 * Close RFQ manually action handler
 */
const closeRFQ = async (req, res) => {
  const updated = await service.closeRFQ(req.params.id, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'inquiries',
    action: 'status change',
    recordId: updated.id,
    newValue: updated,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  await notifyAdmins({
    title: 'RFQ Closed',
    message: `Inquiry ${updated.inquiryNumber} RFQ has been closed manually.`,
    type: 'inquiry',
    relatedModule: 'inquiries',
    relatedRecordId: updated.id
  });

  const fullInquiry = await service.getInquiryById(updated.id);
  return sendSuccess(res, 'RFQ manually closed successfully', fullInquiry);
};

/**
 * Select supplier quote action handler
 */
const selectSupplierQuote = async (req, res) => {
  const updated = await service.selectSupplierQuote(req.params.id, req.body.quoteId, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'inquiries',
    action: 'update',
    recordId: updated.id,
    newValue: updated,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  const fullInquiry = await service.getInquiryById(updated.id);
  return sendSuccess(res, 'Supplier quote selected successfully', fullInquiry);
};

/**
 * Select a specific supplier quote ITEM (per-product selection)
 */
const selectSupplierQuoteItem = async (req, res) => {
  const { id } = req.params;
  const { quoteItemId } = req.body;
  if (!quoteItemId) {
    return res.status(400).json({ success: false, message: 'quoteItemId is required' });
  }
  const result = await service.selectSupplierQuoteItem(parseInt(id), parseInt(quoteItemId), req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'inquiries',
    action: 'update',
    recordId: parseInt(id),
    newValue: { quoteItemId },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  const fullInquiry = await service.getInquiryById(parseInt(id));
  return sendSuccess(res, 'Product sourcing selection updated', fullInquiry);
};

/**
 * Batch: confirm all checkbox selections at once
 */
const selectSupplierQuoteItems = async (req, res) => {
  const { id } = req.params;
  const { selections } = req.body;
  if (!selections || !Array.isArray(selections) || selections.length === 0) {
    return res.status(400).json({ success: false, message: 'selections array is required' });
  }
  await service.selectSupplierQuoteItems(parseInt(id), selections, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'inquiries',
    action: 'update',
    recordId: parseInt(id),
    newValue: { selections },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  const fullInquiry = await service.getInquiryById(parseInt(id));
  return sendSuccess(res, 'Sourcing selections confirmed', fullInquiry);
};

module.exports = {
  getInquiries,
  getInquiry,
  createInquiry,
  createPublicInquiry,
  updateInquiry,
  deleteInquiry,

  // Pipeline Handlers
  stockCheck,
  sendRFQ,
  supplierQuote,
  clientQuote,
  teamLeadApprove,
  adminApprove,
  finalVerify,
  clientDecision,
  confirmDeal,
  close,
  closeRFQ,
  selectSupplierQuote,
  selectSupplierQuoteItem,
  selectSupplierQuoteItems
};
