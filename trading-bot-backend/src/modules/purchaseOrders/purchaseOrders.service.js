const prisma = require('../../prisma/client');

/**
 * Get all purchase orders
 */
const getAllPurchaseOrders = async () => {
  return await prisma.purchaseOrder.findMany({
    where: { deletedAt: null },
    include: {
      supplier: true,
      client: true,
      inquiry: true,
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

/**
 * Get purchase order by ID
 */
const getPurchaseOrderById = async (id) => {
  return await prisma.purchaseOrder.findFirst({
    where: { id, deletedAt: null },
    include: {
      supplier: true,
      client: true,
      inquiry: true,
      items: {
        include: {
          product: true
        }
      }
    }
  });
};

/**
 * Create a new Purchase Order
 */
const createPurchaseOrder = async (data, creatorId) => {
  return await prisma.$transaction(async (tx) => {
    const poCount = await tx.purchaseOrder.count();
    const poNumber = `PO-${1000 + poCount + 1}`;

    const po = await tx.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: data.supplierId,
        clientId: data.clientId,
        inquiryId: data.inquiryId || null,
        status: data.status || 'PENDING',
        amount: data.amount,
        expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null,
        attachment: data.attachment || null,
        emailStatus: 'PENDING',
        createdById: creatorId
      }
    });

    if (data.items && data.items.length > 0) {
      await tx.purchaseOrderItem.createMany({
        data: data.items.map((item) => ({
          purchaseOrderId: po.id,
          productId: item.productId,
          description: item.description || '',
          quantity: parseInt(item.quantity, 10),
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        }))
      });
    }

    return await tx.purchaseOrder.findUnique({
      where: { id: po.id },
      include: {
        supplier: true,
        client: true,
        items: true
      }
    });
  });
};

/**
 * Update Purchase Order
 */
const updatePurchaseOrder = async (id, data, updaterId) => {
  return await prisma.$transaction(async (tx) => {
    const updateData = {
      updatedById: updaterId
    };

    if (data.status) updateData.status = data.status;
    if (data.expectedDeliveryDate) updateData.expectedDeliveryDate = new Date(data.expectedDeliveryDate);
    if (data.amount) updateData.amount = data.amount;
    if (data.attachment) updateData.attachment = data.attachment;

    const po = await tx.purchaseOrder.update({
      where: { id },
      data: updateData
    });

    if (data.items && data.items.length > 0) {
      // Clear existing
      await tx.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: id }
      });
      // Write new
      await tx.purchaseOrderItem.createMany({
        data: data.items.map((item) => ({
          purchaseOrderId: id,
          productId: item.productId,
          description: item.description || '',
          quantity: parseInt(item.quantity, 10),
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        }))
      });
    }

    return await tx.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        client: true,
        items: true
      }
    });
  });
};

/**
 * Soft delete Purchase Order
 */
const deletePurchaseOrder = async (id, updaterId) => {
  return await prisma.purchaseOrder.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
      updatedById: updaterId
    }
  });
};

/**
 * Update PO email status
 */
const sendPOEmail = async (id, updaterId) => {
  return await prisma.purchaseOrder.update({
    where: { id },
    data: {
      emailStatus: 'SENT',
      updatedById: updaterId
    }
  });
};

module.exports = {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  sendPOEmail
};
