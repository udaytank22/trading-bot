const service = require('./inventory.service');
const { sendSuccess, sendError } = require('../../utils/response');
const { createAuditLog } = require('../auditLogs/auditLogs.service');

/**
 * Get all inventory items
 */
const getItems = async (req, res) => {
  const items = await service.getAllInventoryItems();
  return sendSuccess(res, 'Inventory items retrieved successfully', items);
};

/**
 * Get inventory item details by ID
 */
const getItem = async (req, res) => {
  const item = await service.getInventoryItemById(req.params.id);
  if (!item) {
    return sendError(res, 'Inventory item not found', [], 404);
  }
  return sendSuccess(res, 'Inventory item details retrieved successfully', item);
};

/**
 * Create a new inventory item
 */
const createItem = async (req, res) => {
  try {
    const item = await service.createInventoryItem(req.body, req.user.id);

    await createAuditLog({
      userId: req.user.id,
      module: 'inventory',
      action: 'create',
      recordId: item.id,
      newValue: item,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, 'Inventory item created successfully', item, 201);
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};

/**
 * Update inventory item details
 */
const updateItem = async (req, res) => {
  const old = await service.getInventoryItemById(req.params.id);
  if (!old) {
    return sendError(res, 'Inventory item not found', [], 404);
  }

  try {
    const item = await service.updateInventoryItem(req.params.id, req.body, req.user.id);

    await createAuditLog({
      userId: req.user.id,
      module: 'inventory',
      action: 'update',
      recordId: item.id,
      oldValue: old,
      newValue: item,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, 'Inventory item updated successfully', item);
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};

/**
 * Soft delete inventory item
 */
const deleteItem = async (req, res) => {
  const old = await service.getInventoryItemById(req.params.id);
  if (!old) {
    return sendError(res, 'Inventory item not found', [], 404);
  }

  await service.deleteInventoryItem(req.params.id, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'inventory',
    action: 'delete',
    recordId: req.params.id,
    oldValue: old,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return sendSuccess(res, 'Inventory item deleted successfully');
};

/**
 * Log a stock movement transaction (IN, OUT, ADJUSTMENT)
 */
const moveStock = async (req, res) => {
  try {
    const movement = await service.createStockMovement(req.body, req.user.id);

    await createAuditLog({
      userId: req.user.id,
      module: 'inventory',
      action: 'update',
      recordId: movement.id,
      newValue: movement,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, 'Stock movement recorded successfully', movement, 201);
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};

/**
 * Check if all given items are available in inventory
 * POST /inventory/check-availability
 * Body: { items: [{ description, quantity }] }
 */
const checkAvailability = async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, 'items array is required', [], 400);
    }
    const result = await service.checkInventoryAvailability(items);
    return sendSuccess(res, 'Inventory availability checked', result);
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};

/**
 * Get paginated inventory transaction history
 * GET /inventory/transactions?type=INVENTORY_RESERVED,INVENTORY_DISPATCHED&page=1&pageSize=20
 */
const getTransactionHistory = async (req, res) => {
  try {
    const result = await service.getInventoryTransactionHistory(req.query);
    const meta = {
      totalItems: result.total,
      currentPage: parseInt(req.query.page || 1),
      pageSize: parseInt(req.query.pageSize || 20),
      totalPages: Math.ceil(result.total / parseInt(req.query.pageSize || 20))
    };
    return sendSuccess(res, 'Transaction history retrieved successfully', result.data, 200, meta);
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};

/**
 * Dispatch inventory for an inquiry (mark items as dispatched)
 * POST /inventory/dispatch-inquiry/:inquiryId
 */
const dispatchInquiryInventory = async (req, res) => {
  try {
    const inquiryId = parseInt(req.params.inquiryId, 10);
    const { inquiryNumber } = req.body;
    const userEmail = req.user.email || 'system';

    const movements = await service.dispatchInventoryForInquiry(
      inquiryId,
      inquiryNumber || `INQ-${inquiryId}`,
      req.user.id,
      userEmail
    );

    await createAuditLog({
      userId: req.user.id,
      module: 'inventory',
      action: 'dispatch',
      recordId: inquiryId,
      newValue: { movements: movements.length },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, 'Inventory dispatched successfully', { movementsCreated: movements.length });
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};

module.exports = {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  moveStock,
  checkAvailability,
  getTransactionHistory,
  dispatchInquiryInventory
};
