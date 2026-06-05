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
  // Check for duplicate supplier (by email or name)
  const existingSupplier = await prisma.supplier.findFirst({
    where: {
      OR: [
        { email: data.email },
        { name: data.name }
      ],
      deletedAt: null
    }
  });

  if (existingSupplier) {
    const err = new Error(`A supplier with this ${existingSupplier.email === data.email ? 'email' : 'name'} already exists.`);
    err.statusCode = 400;
    throw err;
  }

  return await prisma.supplier.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      company: data.company || null,
      address: data.address || null,
      categories: data.categories || [],
      createdById: creatorId,
      isActive: data.isActive !== undefined ? data.isActive : true
    }
  });
};

/**
 * Update supplier
 */
const updateSupplier = async (id, data, updaterId) => {
  // Check for duplicate supplier (by email or name) excluding the current supplier
  const existingSupplier = await prisma.supplier.findFirst({
    where: {
      id: { not: id },
      OR: [
        { email: data.email },
        { name: data.name }
      ],
      deletedAt: null
    }
  });

  if (existingSupplier) {
    const err = new Error(`A supplier with this ${existingSupplier.email === data.email ? 'email' : 'name'} already exists.`);
    err.statusCode = 400;
    throw err;
  }

  return await prisma.supplier.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      address: data.address,
      categories: data.categories !== undefined ? data.categories : undefined,
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

/**
 * Bulk import suppliers
 */
const bulkImportSuppliers = async (suppliersArray, updaterId) => {
  return await prisma.$transaction(async (tx) => {
    let successCount = 0;
    for (const data of suppliersArray) {
      if (data.id) {
        await tx.supplier.update({
          where: { id: data.id },
          data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            company: data.company,
            address: data.address,
            categories: data.categories !== undefined ? data.categories : undefined,
            isActive: data.isActive,
            updatedById: updaterId
          }
        });
      } else {
        await tx.supplier.create({
          data: {
            name: data.name,
            email: data.email,
            phone: data.phone || null,
            company: data.company || null,
            address: data.address || null,
            categories: data.categories || [],
            createdById: updaterId,
            isActive: data.isActive !== undefined ? data.isActive : true
          }
        });
      }
      successCount++;
    }
    return { successCount };
  }, { timeout: 60000 });
};

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  bulkImportSuppliers
};
