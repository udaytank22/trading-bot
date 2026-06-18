const prisma = require('../../prisma/client');

/**
 * Get all inventory items with warehouse balances
 */
const getAllInventoryItems = async () => {
  return await prisma.inventoryItem.findMany({
    where: { deletedAt: null },
    include: {
      stocks: {
        include: {
          warehouse: true
        }
      }
    },
    orderBy: { itemName: 'asc' }
  });
};

/**
 * Get inventory item details and complete movements history ledger
 */
const getInventoryItemById = async (id) => {
  return await prisma.inventoryItem.findFirst({
    where: { id: parseInt(id, 10), deletedAt: null },
    include: {
      stocks: {
        include: {
          warehouse: true
        }
      },
      movements: {
        include: {
          warehouse: true
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });
};

/**
 * Create a new inventory catalog item
 */
const createInventoryItem = async (data, creatorId) => {
  // Check for duplicate inventory item (by sku or itemName)
  const existingItem = await prisma.inventoryItem.findFirst({
    where: {
      OR: [
        { sku: data.sku },
        { itemName: data.itemName }
      ],
      deletedAt: null
    }
  });

  if (existingItem) {
    const err = new Error(`An inventory item with this ${existingItem.sku === data.sku ? 'SKU' : 'item name'} already exists.`);
    err.statusCode = 400;
    throw err;
  }

  return await prisma.inventoryItem.create({
    data: {
      itemName: data.itemName,
      sku: data.sku,
      category: data.category || null,
      unit: data.unit || null,
      sellingPrice: parseFloat(data.sellingPrice),
      purchasePrice: parseFloat(data.purchasePrice),
      minimumStockLevel: data.minimumStockLevel !== undefined ? parseInt(data.minimumStockLevel, 10) : 5,
      status: data.status || 'ACTIVE',
      createdById: creatorId
    }
  });
};

/**
 * Update inventory item catalog details
 */
const updateInventoryItem = async (id, data, updaterId) => {
  const itemId = parseInt(id, 10);
  // Check for duplicate inventory item (by sku or itemName) excluding the current item
  const existingItem = await prisma.inventoryItem.findFirst({
    where: {
      id: { not: itemId },
      OR: [
        { sku: data.sku },
        { itemName: data.itemName }
      ],
      deletedAt: null
    }
  });

  if (existingItem) {
    const err = new Error(`An inventory item with this ${existingItem.sku === data.sku ? 'SKU' : 'item name'} already exists.`);
    err.statusCode = 400;
    throw err;
  }

  return await prisma.inventoryItem.update({
    where: { id: itemId },
    data: {
      itemName: data.itemName,
      sku: data.sku,
      category: data.category,
      unit: data.unit,
      sellingPrice: data.sellingPrice ? parseFloat(data.sellingPrice) : undefined,
      purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice) : undefined,
      minimumStockLevel: data.minimumStockLevel !== undefined ? parseInt(data.minimumStockLevel, 10) : undefined,
      status: data.status,
      updatedById: updaterId
    }
  });
};

/**
 * Soft delete inventory item
 */
const deleteInventoryItem = async (id, updaterId) => {
  return await prisma.inventoryItem.update({
    where: { id: parseInt(id, 10) },
    data: {
      deletedAt: new Date(),
      status: 'INACTIVE',
      updatedById: updaterId
    }
  });
};

/**
 * Log a stock movement ledger entry and adjust warehouse stock
 */
const createStockMovement = async (data, creatorId) => {
  return await prisma.$transaction(async (tx) => {
    const qty = parseInt(data.quantity, 10);
    const type = data.type; // IN, OUT, ADJUSTMENT, INVENTORY_RESERVED, INVENTORY_RELEASED, INVENTORY_DISPATCHED
    const itemId = data.inventoryItemId;
    const warehouseId = data.warehouseId;

    // 1. Insert Movement Record
    const movement = await tx.stockMovement.create({
      data: {
        inventoryItemId: itemId,
        warehouseId,
        type,
        quantity: qty,
        referenceType: data.referenceType || null,
        referenceId: data.referenceId || null,
        referenceNumber: data.referenceNumber || null,
        actionBy: data.actionBy || null,
        remarks: data.remarks || null,
        createdById: creatorId
      }
    });

    // 2. Adjust warehouse quantities based on movement types
    let stock = await tx.warehouseStock.findUnique({
      where: {
        warehouseId_inventoryItemId: {
          warehouseId,
          inventoryItemId: itemId
        }
      }
    });

    if (!stock) {
      stock = await tx.warehouseStock.create({
        data: {
          warehouseId,
          inventoryItemId: itemId,
          quantity: 0
        }
      });
    }

    let newQuantity = stock.quantity;
    if (type === 'IN') {
      newQuantity += qty;
    } else if (type === 'OUT' || type === 'INVENTORY_RESERVED' || type === 'INVENTORY_DISPATCHED') {
      newQuantity -= qty;
    } else if (type === 'INVENTORY_RELEASED') {
      newQuantity += qty; // return stock
    } else if (type === 'ADJUSTMENT') {
      newQuantity += qty; // relative change
    }

    await tx.warehouseStock.update({
      where: { id: stock.id },
      data: {
        quantity: newQuantity >= 0 ? newQuantity : 0
      }
    });

    return movement;
  });
};

/* ==========================================================================
   Inventory Auto-Fulfillment Functions
   ========================================================================== */

/**
 * Check whether all inquiry items are available in inventory.
 * Matches by itemName (case-insensitive) or SKU.
 *
 * @param {Array<{description: string, quantity: number}>} inquiryItems
 * @returns {{ allAvailable: boolean, availableItems: Array, unavailableItems: Array }}
 */
const checkInventoryAvailability = async (inquiryItems) => {
  const allInventory = await prisma.inventoryItem.findMany({
    where: { deletedAt: null, status: 'ACTIVE' },
    include: {
      stocks: true
    }
  });

  const availableItems = [];
  const unavailableItems = [];

  for (const inquiryItem of inquiryItems) {
    const descLower = inquiryItem.description.toLowerCase().trim();

    // Match by itemName (case-insensitive) or SKU
    const match = allInventory.find(inv => {
      const nameLower = inv.itemName.toLowerCase().trim();
      const skuLower = (inv.sku || '').toLowerCase().trim();
      return nameLower === descLower || skuLower === descLower;
    });

    if (!match) {
      unavailableItems.push({
        description: inquiryItem.description,
        requested: inquiryItem.quantity,
        reason: 'Item not found in inventory catalog'
      });
      continue;
    }

    const totalStock = match.stocks.reduce((acc, s) => acc + s.quantity, 0);
    const requested = parseInt(inquiryItem.quantity, 10);

    if (totalStock >= requested) {
      availableItems.push({
        inventoryItem: match,
        inquiryItem,
        availableQty: totalStock,
        requestedQty: requested
      });
    } else {
      unavailableItems.push({
        description: inquiryItem.description,
        requested,
        available: totalStock,
        reason: `Insufficient stock (${totalStock} available, ${requested} requested)`
      });
    }
  }

  return {
    allAvailable: unavailableItems.length === 0,
    availableItems,
    unavailableItems
  };
};

/**
 * Atomically reserve inventory for an inquiry.
 * Deducts quantities from warehouse stock and logs INVENTORY_RESERVED movements.
 *
 * @param {Array} availableItems - from checkInventoryAvailability
 * @param {number} inquiryId
 * @param {string} inquiryNumber
 * @param {number} userId - user or system user ID
 * @param {string} userEmail - for actionBy audit field
 */
const reserveInventoryForInquiry = async (availableItems, inquiryId, inquiryNumber, userId, userEmail = 'system') => {
  return await prisma.$transaction(async (tx) => {
    const movements = [];

    for (const { inventoryItem, inquiryItem, requestedQty } of availableItems) {
      let remainingToReserve = requestedQty;

      // Find warehouses with stock for this item (prefer highest stock first)
      const stocks = await tx.warehouseStock.findMany({
        where: { inventoryItemId: inventoryItem.id, quantity: { gt: 0 } },
        orderBy: { quantity: 'desc' }
      });

      for (const stock of stocks) {
        if (remainingToReserve <= 0) break;

        const deductQty = Math.min(stock.quantity, remainingToReserve);
        const previousQuantity = stock.quantity;
        const newQuantity = stock.quantity - deductQty;

        // Deduct from warehouse stock
        await tx.warehouseStock.update({
          where: { id: stock.id },
          data: { quantity: newQuantity }
        });

        // Log movement with full audit info
        const movement = await tx.stockMovement.create({
          data: {
            inventoryItemId: inventoryItem.id,
            warehouseId: stock.warehouseId,
            type: 'INVENTORY_RESERVED',
            quantity: deductQty,
            previousQuantity,
            remainingQuantity: newQuantity,
            referenceType: 'INQUIRY',
            referenceId: inquiryId,
            referenceNumber: inquiryNumber,
            actionBy: userEmail,
            remarks: `Auto-reserved for inquiry ${inquiryNumber}: ${inquiryItem.description} (x${deductQty})`,
            createdById: userId
          }
        });

        movements.push(movement);
        remainingToReserve -= deductQty;
      }
    }

    return movements;
  });
};

/**
 * Release previously reserved inventory for an inquiry (cancellation/rejection).
 * Creates INVENTORY_RELEASED movements to return stock.
 *
 * @param {number} inquiryId
 * @param {string} inquiryNumber
 * @param {number} userId
 * @param {string} userEmail
 */
const releaseInventoryForInquiry = async (inquiryId, inquiryNumber, userId, userEmail = 'system') => {
  return await prisma.$transaction(async (tx) => {
    // Find all INVENTORY_RESERVED movements for this inquiry
    const reservedMovements = await tx.stockMovement.findMany({
      where: {
        referenceType: 'INQUIRY',
        referenceId: inquiryId,
        type: 'INVENTORY_RESERVED'
      }
    });

    if (reservedMovements.length === 0) {
      return []; // Nothing to release
    }

    const releaseMovements = [];

    for (const reserved of reservedMovements) {
      // Return stock to warehouse
      const stock = await tx.warehouseStock.findUnique({
        where: {
          warehouseId_inventoryItemId: {
            warehouseId: reserved.warehouseId,
            inventoryItemId: reserved.inventoryItemId
          }
        }
      });

      const currentQty = stock ? stock.quantity : 0;
      const newQty = currentQty + reserved.quantity;

      if (stock) {
        await tx.warehouseStock.update({
          where: { id: stock.id },
          data: { quantity: newQty }
        });
      } else {
        await tx.warehouseStock.create({
          data: {
            warehouseId: reserved.warehouseId,
            inventoryItemId: reserved.inventoryItemId,
            quantity: reserved.quantity
          }
        });
      }

      // Log release movement
      const releaseMovement = await tx.stockMovement.create({
        data: {
          inventoryItemId: reserved.inventoryItemId,
          warehouseId: reserved.warehouseId,
          type: 'INVENTORY_RELEASED',
          quantity: reserved.quantity,
          previousQuantity: currentQty,
          remainingQuantity: newQty,
          referenceType: 'INQUIRY',
          referenceId: inquiryId,
          referenceNumber: inquiryNumber,
          actionBy: userEmail,
          remarks: `Released reserved stock for inquiry ${inquiryNumber} (inquiry rejected/cancelled)`,
          createdById: userId
        }
      });

      releaseMovements.push(releaseMovement);
    }

    return releaseMovements;
  });
};

/**
 * Mark inventory as dispatched for an inquiry.
 * Creates INVENTORY_DISPATCHED movements (stock was already deducted at RESERVED stage).
 *
 * @param {number} inquiryId
 * @param {string} inquiryNumber
 * @param {number} userId
 * @param {string} userEmail
 */
const dispatchInventoryForInquiry = async (inquiryId, inquiryNumber, userId, userEmail = 'system') => {
  return await prisma.$transaction(async (tx) => {
    // Find all INVENTORY_RESERVED movements for this inquiry
    const reservedMovements = await tx.stockMovement.findMany({
      where: {
        referenceType: 'INQUIRY',
        referenceId: inquiryId,
        type: 'INVENTORY_RESERVED'
      }
    });

    const dispatchMovements = [];

    for (const reserved of reservedMovements) {
      // Stock is already deducted — just log the dispatch event
      const dispatchMovement = await tx.stockMovement.create({
        data: {
          inventoryItemId: reserved.inventoryItemId,
          warehouseId: reserved.warehouseId,
          type: 'INVENTORY_DISPATCHED',
          quantity: reserved.quantity,
          previousQuantity: 0, // already deducted at reservation
          remainingQuantity: 0,
          referenceType: 'INQUIRY',
          referenceId: inquiryId,
          referenceNumber: inquiryNumber,
          actionBy: userEmail,
          remarks: `Dispatched from inventory for inquiry ${inquiryNumber}`,
          createdById: userId
        }
      });

      dispatchMovements.push(dispatchMovement);
    }

    return dispatchMovements;
  });
};

/**
 * Get paginated inventory transaction history
 * (INVENTORY_RESERVED, INVENTORY_DISPATCHED, INVENTORY_RELEASED, IN, OUT, ADJUSTMENT)
 *
 * @param {Object} filters - { page, pageSize, type, itemName, startDate, endDate, referenceNumber }
 */
const getInventoryTransactionHistory = async (filters = {}) => {
  const {
    page = 1,
    pageSize = 20,
    type,
    itemName,
    startDate,
    endDate,
    referenceNumber
  } = filters;

  const where = { deletedAt: null };

  if (type) {
    if (type.includes(',')) {
      where.type = { in: type.split(',').map(t => t.trim()) };
    } else {
      where.type = type;
    }
  }

  if (referenceNumber) {
    where.referenceNumber = { contains: referenceNumber, mode: 'insensitive' };
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  if (itemName) {
    where.inventoryItem = {
      itemName: { contains: itemName, mode: 'insensitive' }
    };
  }

  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize);

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        inventoryItem: {
          select: { id: true, itemName: true, sku: true, unit: true }
        },
        warehouse: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    }),
    prisma.stockMovement.count({ where })
  ]);

  return { data: movements, total };
};

module.exports = {
  getAllInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  createStockMovement,
  // Auto-fulfillment functions
  checkInventoryAvailability,
  reserveInventoryForInquiry,
  releaseInventoryForInquiry,
  dispatchInventoryForInquiry,
  getInventoryTransactionHistory
};
