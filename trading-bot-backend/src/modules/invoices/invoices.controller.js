const service = require('./invoices.service');
const { sendSuccess, sendError } = require('../../utils/response');
const { createAuditLog } = require('../auditLogs/auditLogs.service');
const { createNotification } = require('../notifications/notifications.service');

/**
 * Get all invoices
 */
const getInvoices = async (req, res) => {
  const invoices = await service.getAllInvoices();
  return sendSuccess(res, 'Invoices list retrieved successfully', invoices);
};

/**
 * Get invoice by ID
 */
const getInvoice = async (req, res) => {
  const invoice = await service.getInvoiceById(req.params.id);
  if (!invoice) {
    return sendError(res, 'Invoice not found', [], 404);
  }
  return sendSuccess(res, 'Invoice details retrieved successfully', invoice);
};

/**
 * Create a new invoice
 */
const createInvoice = async (req, res) => {
  const invoice = await service.createInvoice(req.body, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'invoices',
    action: 'create',
    recordId: invoice.id,
    newValue: invoice,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return sendSuccess(res, 'Invoice created successfully', invoice, 201);
};

/**
 * Update invoice details
 */
const updateInvoice = async (req, res) => {
  const old = await service.getInvoiceById(req.params.id);
  if (!old) {
    return sendError(res, 'Invoice not found', [], 404);
  }

  const invoice = await service.updateInvoice(req.params.id, req.body, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'invoices',
    action: 'update',
    recordId: invoice.id,
    oldValue: old,
    newValue: invoice,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  // If status is updated to SENT
  if (req.body.status === 'SENT' && old.status !== 'SENT') {
    await createNotification({
      userId: req.user.id,
      title: 'Invoice Dispatched',
      message: `Invoice ${invoice.invoiceNumber} has been sent to the client.`,
      type: 'document',
      relatedModule: 'invoices',
      relatedRecordId: invoice.id
    });
  }

  return sendSuccess(res, 'Invoice updated successfully', invoice);
};

/**
 * Delete invoice
 */
const deleteInvoice = async (req, res) => {
  const old = await service.getInvoiceById(req.params.id);
  if (!old) {
    return sendError(res, 'Invoice not found', [], 404);
  }

  await service.deleteInvoice(req.params.id, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'invoices',
    action: 'delete',
    recordId: req.params.id,
    oldValue: old,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return sendSuccess(res, 'Invoice deleted successfully');
};

module.exports = {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice
};
