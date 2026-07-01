const prisma = require('../../prisma/client');

const { getPaginationParams } = require('../../utils/queryHelper');
const { notifyRole, notifyUser } = require('../notifications/notifications.service');

/**
 * Get all purchase orders
 */
const getAllPurchaseOrders = async (query = {}) => {
  const where = { deletedAt: null };

  const { skip, take } = getPaginationParams(query);

  const [pos, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true, email: true } },
        inquiry: {
          select: { id: true, inquiryNumber: true, vesselName: true }
        },
        items: {
          include: {
            product: true
          }
        },
        _count: {
          select: { items: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    }),
    prisma.purchaseOrder.count({ where })
  ]);

  return { data: pos, total };
};

/**
 * Get purchase order by ID
 */
const getPurchaseOrderById = async (id) => {
  const poId = parseInt(id, 10);
  return await prisma.purchaseOrder.findFirst({
    where: { id: poId, deletedAt: null },
    include: {
      supplier: true,
      client: true,
      inquiry: {
        include: {
          items: true,
          supplierQuotes: {
            include: {
              items: true,
              supplier: true
            }
          }
        }
      },
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

    const createdPo = await tx.purchaseOrder.findUnique({
      where: { id: po.id },
      include: {
        supplier: true,
        client: true,
        items: true
      }
    });
    
    return createdPo;
  }).then(async (createdPo) => {
    // Fire notifications asynchronously after transaction
    await notifyRole('Admin', {
      title: 'New Purchase Order Created',
      message: `PO ${createdPo.poNumber} has been created for ${createdPo.supplier?.name}.`,
      type: 'PO_CREATED',
      relatedModule: 'PURCHASE_ORDER',
      relatedRecordId: createdPo.id
    });
    return createdPo;
  });
};

/**
 * Update Purchase Order
 */
const updatePurchaseOrder = async (id, data, updaterId) => {
  const poId = parseInt(id, 10);
  return await prisma.$transaction(async (tx) => {
    const updateData = {
      updatedById: updaterId
    };

    if (data.status) updateData.status = data.status;
    if (data.expectedDeliveryDate) updateData.expectedDeliveryDate = new Date(data.expectedDeliveryDate);
    if (data.amount) updateData.amount = data.amount;
    if (data.attachment) updateData.attachment = data.attachment;

    const po = await tx.purchaseOrder.update({
      where: { id: poId },
      data: updateData
    });

    if (data.status === 'ORDERED') {
      if (po.inquiryId) {
        await tx.inquiry.update({
          where: { id: po.inquiryId },
          data: { currentStatus: 'CONFIRMED' }
        });

        await tx.inquiryStatusHistory.create({
          data: {
            inquiryId: po.inquiryId,
            fromStatus: 'QUOTE_SENT',
            toStatus: 'CONFIRMED',
            changedById: updaterId,
            remarks: 'Order placed on Purchase Order'
          }
        });
      }

      await tx.shipment.updateMany({
        where: { purchaseOrderId: poId },
        data: { currentStatus: 'ORDER_PLACED' }
      });
    }

    if (data.items && data.items.length > 0) {
      // Clear existing
      await tx.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: poId }
      });
      // Write new
      await tx.purchaseOrderItem.createMany({
        data: data.items.map((item) => ({
          purchaseOrderId: poId,
          productId: item.productId,
          description: item.description || '',
          quantity: parseInt(item.quantity, 10),
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        }))
      });
    }

    const updatedPo = await tx.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        supplier: true,
        client: true,
        items: true
      }
    });

    return updatedPo;
  }).then(async (updatedPo) => {
    // Trigger notification if status changed
    if (data.status) {
      await notifyRole('Admin', {
        title: `Purchase Order Status Updated`,
        message: `PO ${updatedPo.poNumber} is now ${data.status}.`,
        type: 'PO_STATUS_UPDATED',
        relatedModule: 'PURCHASE_ORDER',
        relatedRecordId: updatedPo.id
      });
    }
    return updatedPo;
  });
};

/**
 * Soft delete Purchase Order
 */
const deletePurchaseOrder = async (id, updaterId) => {
  const poId = parseInt(id, 10);
  return await prisma.purchaseOrder.update({
    where: { id: poId },
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
  const poId = parseInt(id, 10);
  return await prisma.purchaseOrder.update({
    where: { id: poId },
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
