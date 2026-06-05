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
    where: { id, deletedAt: null },
    include: {
      stocks: {
        include: {
          warehouse: true
        }
      },
      movements: {
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
  // Check for duplicate inventory item (by sku or itemName) excluding the current item
  const existingItem = await prisma.inventoryItem.findFirst({
    where: {
      id: { not: id },
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
    where: { id },
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
    where: { id },
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
    const type = data.type; // IN, OUT, ADJUSTMENT, RESERVED, RELEASED
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
    } else if (type === 'OUT') {
      newQuantity -= qty;
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

module.exports = {
  getAllInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  createStockMovement
};
