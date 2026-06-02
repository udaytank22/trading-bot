const prisma = require('../../prisma/client');

/**
 * Get all active suppliers
 */
const getAllSuppliers = async () => {
  return await prisma.supplier.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' }
  });
};

/**
 * Get supplier by ID
 */
const getSupplierById = async (id) => {
  return await prisma.supplier.findFirst({
    where: { id, deletedAt: null }
  });
};

/**
 * Create supplier
 */
const createSupplier = async (data, creatorId) => {
  return await prisma.supplier.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      company: data.company || null,
      address: data.address || null,
      products: data.products || [],
      createdById: creatorId,
      isActive: data.isActive !== undefined ? data.isActive : true
    }
  });
};

/**
 * Update supplier
 */
const updateSupplier = async (id, data, updaterId) => {
  return await prisma.supplier.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      address: data.address,
      products: data.products !== undefined ? data.products : undefined,
      isActive: data.isActive,
      updatedById: updaterId
    }
  });
};

const deleteSupplier = async (id, updaterId) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Delete InquirySupplier associations
    await tx.inquirySupplier.deleteMany({
      where: { supplierId: id }
    });

    // 2. Delete SupplierQuoteItems and SupplierQuotes
    const quotes = await tx.supplierQuote.findMany({
      where: { supplierId: id },
      select: { id: true }
    });
    const quoteIds = quotes.map(q => q.id);
    if (quoteIds.length > 0) {
      await tx.supplierQuoteItem.deleteMany({
        where: { supplierQuoteId: { in: quoteIds } }
      });
      await tx.supplierQuote.deleteMany({
        where: { id: { in: quoteIds } }
      });
    }

    // 3. Delete PurchaseOrderItems and PurchaseOrders
    const purchaseOrders = await tx.purchaseOrder.findMany({
      where: { supplierId: id },
      select: { id: true }
    });
    const poIds = purchaseOrders.map(po => po.id);
    if (poIds.length > 0) {
      await tx.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: { in: poIds } }
      });
      await tx.purchaseOrder.deleteMany({
        where: { id: { in: poIds } }
      });
    }

    // 4. Handle Shipments
    const shipments = await tx.shipment.findMany({
      where: { supplierId: id },
      select: { id: true }
    });
    const shipmentIds = shipments.map(s => s.id);
    if (shipmentIds.length > 0) {
      // Disassociate shipments from invoices (set shipmentId to null)
      await tx.invoice.updateMany({
        where: { shipmentId: { in: shipmentIds } },
        data: { shipmentId: null }
      });
      // Delete shipments
      await tx.shipment.deleteMany({
        where: { id: { in: shipmentIds } }
      });
    }

    // 5. Finally, delete the supplier from the database
    return await tx.supplier.delete({
      where: { id }
    });
  });
};

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
};
