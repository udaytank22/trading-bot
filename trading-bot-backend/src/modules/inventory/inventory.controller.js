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

module.exports = {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  moveStock
};
