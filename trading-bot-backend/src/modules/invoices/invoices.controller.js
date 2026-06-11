const service = require('./invoices.service');
const { sendSuccess, sendError } = require('../../utils/response');
const { createAuditLog } = require('../auditLogs/auditLogs.service');
const { createNotification } = require('../notifications/notifications.service');

/**
 * Get all invoices
 */
const getInvoices = async (req, res) => {
  const { data, total } = await service.getAllInvoices(req.user, req.query);
  const meta = {
    totalItems: total,
    currentPage: req.query.page ? parseInt(req.query.page) : 1,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize) : total,
    totalPages: req.query.pageSize ? Math.ceil(total / parseInt(req.query.pageSize)) : 1
  };
  return sendSuccess(res, 'Invoices list retrieved successfully', data, 200, meta);
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

/**
 * Generate invoice from shipment
 */
const generateInvoiceFromShipment = async (req, res) => {
  try {
    const result = await service.generateInvoiceFromShipment(req.params.shipmentId, req.user.id);

    await createAuditLog({
      userId: req.user.id,
      module: 'invoices',
      action: 'create',
      recordId: result.invoice.id,
      newValue: result.invoice,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, 'Invoice draft generated successfully', result, 201);
  } catch (err) {
    console.error('Invoice generation error:', err);
    return sendError(res, err.message || 'Failed to generate invoice', [], 500);
  }
};

/**
 * Generate invoice from inquiry (grouped orders)
 */
const createInvoiceFromInquiry = async (req, res) => {
  try {
    const inquiryId = req.body.inquiryId;
    if (!inquiryId) return sendError(res, 'inquiryId is required', [], 400);

    const result = await service.generateInvoiceFromInquiry(inquiryId, req.user.id);

    await createAuditLog({
      userId: req.user.id,
      module: 'invoices',
      action: 'create',
      recordId: result.invoice.id,
      newValue: result.invoice,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, 'Invoice generated successfully', result, 201);
  } catch (err) {
    console.error('Invoice generation error:', err);
    return sendError(res, err.message || 'Failed to generate invoice', [], 500);
  }
};

/**
 * Send drafted invoice email
 */
const sendInvoiceEmail = async (req, res) => {
  try {
    const { subject, body, toEmail } = req.body;
    const result = await service.sendInvoiceEmailAPI(req.params.id, subject, body, req.user.id, toEmail);

    await createAuditLog({
      userId: req.user.id,
      module: 'invoices',
      action: 'send',
      recordId: result.invoice.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, 'Invoice emailed successfully', result);
  } catch (err) {
    console.error('Invoice send error:', err);
    return sendError(res, err.message || 'Failed to send invoice', [], 500);
  }
};

/**
 * Preview drafted invoice
 */
const previewInvoice = async (req, res) => {
  try {
    const { pdfBuffer, invoice } = await service.generateInvoicePdfBuffer(req.params.id);
    const pdfBase64 = pdfBuffer.toString('base64');
    const defaultEmailSubject = `Your Invoice ${invoice.invoiceNumber}`;
    const defaultEmailBody = `Dear Client,\n\nPlease find attached the invoice ${invoice.invoiceNumber} for your recent order.\n\nThank you for your business!`;

    const result = {
      invoice,
      pdfBase64,
      defaultEmailSubject,
      defaultEmailBody
    };
    return sendSuccess(res, 'Invoice preview generated successfully', result);
  } catch (err) {
    console.error('Invoice preview error:', err);
    return sendError(res, err.message || 'Failed to preview invoice', [], 500);
  }
};

/**
 * Download invoice PDF
 */
const downloadInvoicePdf = async (req, res) => {
  try {
    const { pdfBuffer, invoice } = await service.generateInvoicePdfBuffer(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoice.invoiceNumber}.pdf`);
    res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    console.error('Download PDF error:', err);
    return sendError(res, err.message || 'Failed to download PDF', [], 500);
  }
};

module.exports = {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  generateInvoiceFromShipment,
  createInvoiceFromInquiry,
  sendInvoiceEmail,
  downloadInvoicePdf,
  previewInvoice
};
