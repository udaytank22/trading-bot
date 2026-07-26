const service = require('./purchaseOrders.service');
const { sendSuccess, sendError } = require('../../utils/response');

const { createNotification } = require('../notifications/notifications.service');
const emailService = require('../email/email.service');

/**
 * Get all purchase orders
 */
const getPurchaseOrders = async (req, res) => {
  const { data, total } = await service.getAllPurchaseOrders(req.query);
  const meta = {
    totalItems: total,
    currentPage: req.query.page ? parseInt(req.query.page) : 1,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize) : total,
    totalPages: req.query.pageSize ? Math.ceil(total / parseInt(req.query.pageSize)) : 1
  };
  return sendSuccess(res, 'Purchase orders list retrieved successfully', data, 200, meta);
};

/**
 * Get purchase order by ID
 */
const getPurchaseOrder = async (req, res) => {
  const po = await service.getPurchaseOrderById(req.params.id);
  if (!po) {
    return sendError(res, 'Purchase order not found', [], 404);
  }
  return sendSuccess(res, 'Purchase order details retrieved successfully', po);
};

/**
 * Create a new Purchase Order
 */
const createPurchaseOrder = async (req, res) => {
  const po = await service.createPurchaseOrder(req.body, req.user.id);

  

  await createNotification({
    userId: req.user.id,
    title: 'Purchase Order Created',
    message: `Purchase Order ${po.poNumber} has been generated.`,
    type: 'purchase-order',
    relatedModule: 'purchaseOrders',
    relatedRecordId: po.id
  });

  return sendSuccess(res, 'Purchase order created successfully', po, 201);
};

/**
 * Update Purchase Order details
 */
const updatePurchaseOrder = async (req, res) => {
  const old = await service.getPurchaseOrderById(req.params.id);
  if (!old) {
    return sendError(res, 'Purchase order not found', [], 404);
  }

  const po = await service.updatePurchaseOrder(req.params.id, req.body, req.user.id);

  

  return sendSuccess(res, 'Purchase order updated successfully', po);
};

/**
 * Delete Purchase Order
 */
const deletePurchaseOrder = async (req, res) => {
  const old = await service.getPurchaseOrderById(req.params.id);
  if (!old) {
    return sendError(res, 'Purchase order not found', [], 404);
  }

  await service.deletePurchaseOrder(req.params.id, req.user.id);

  

  return sendSuccess(res, 'Purchase order deleted successfully');
};

/**
 * Dispatch Purchase Order via simulated email
 */
const sendEmail = async (req, res) => {
  const old = await service.getPurchaseOrderById(req.params.id);
  if (!old) {
    return sendError(res, 'Purchase order not found', [], 404);
  }

  const po = await service.sendPOEmail(req.params.id, req.user.id);

  // Dispatch emails asynchronously (non-blocking)
  emailService.sendSupplierPOEmail(old).catch(err => {
    console.error('Background supplier PO email dispatch failed:', err.message);
  });

  emailService.sendClientPOIssuedEmail(old).catch(err => {
    console.error('Background client PO issued email dispatch failed:', err.message);
  });

  await createNotification({
    userId: req.user.id,
    title: 'PO Dispatched',
    message: `Purchase Order ${po.poNumber} has been emailed to supplier.`,
    type: 'purchase-order',
    relatedModule: 'purchaseOrders',
    relatedRecordId: po.id
  });

  return sendSuccess(res, 'Purchase order email sent successfully', po);
};

module.exports = {
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  sendEmail
};
