const prisma = require('../../prisma/client');
const bcrypt = require('bcryptjs');

const { getPaginationParams } = require('../../utils/queryHelper');

/**
 * Get all active suppliers
 */
const getAllSuppliers = async (query = {}) => {
  const where = { deletedAt: null };

  const { skip, take } = getPaginationParams(query);

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take
    }),
    prisma.supplier.count({ where })
  ]);

  return { data: suppliers, total };
};

/**
 * Get supplier by ID
 */
const getSupplierById = async (id) => {
  return await prisma.supplier.findFirst({
    where: { id: parseInt(id, 10), deletedAt: null }
  });
};

/**
 * Create supplier
 */
const createSupplier = async (data, creatorId) => {
  // Check for duplicate supplier (by email only)
  const existingSupplier = await prisma.supplier.findFirst({
    where: {
      email: data.email,
      deletedAt: null
    }
  });

  if (existingSupplier) {
    const err = new Error(`A supplier with this email already exists.`);
    err.statusCode = 400;
    throw err;
  }

  return await prisma.$transaction(async (tx) => {
    const supplier = await tx.supplier.create({
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

    const clientRole = await tx.role.findFirst({
      where: { name: 'Client' }
    });
    if (clientRole) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);
      await tx.user.create({
        data: {
          email: data.email,
          password: passwordHash,
          roleId: clientRole.id,
          isActive: true
        }
      });
    }

    return supplier;
  });
};

/**
 * Update supplier
 */
const updateSupplier = async (id, data, updaterId) => {
  const supplierId = parseInt(id, 10);
  // Check for duplicate supplier (by email) excluding the current supplier
  const existingSupplier = await prisma.supplier.findFirst({
    where: {
      id: { not: supplierId },
      email: data.email,
      deletedAt: null
    }
  });

  if (existingSupplier) {
    const err = new Error(`A supplier with this email already exists.`);
    err.statusCode = 400;
    throw err;
  }

  const oldSupplier = await prisma.supplier.findUnique({
    where: { id: supplierId }
  });

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.supplier.update({
      where: { id: supplierId },
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

    if (oldSupplier && oldSupplier.email.toLowerCase() !== data.email.toLowerCase()) {
      await tx.user.updateMany({
        where: { email: oldSupplier.email },
        data: { email: data.email }
      });
    }

    return updated;
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

    // Delete corresponding user record
    const supplier = await tx.supplier.findUnique({
      where: { id }
    });
    if (supplier) {
      await tx.user.deleteMany({
        where: { email: supplier.email }
      });
    }

    // 5. Finally, delete the supplier from the database
    return await tx.supplier.delete({
      where: { id }
    });
  });
};

/**
 * Bulk import suppliers (queues a job)
 */
const bulkImportSuppliers = async (suppliersArray, updaterId) => {
  const result = await executeBulkImportSuppliersJob(suppliersArray, updaterId);
  return { successCount: result.successCount, status: 'completed' };
};

/**
 * Execute bulk import job (called by Worker)
 */
const executeBulkImportSuppliersJob = async (suppliersArray, updaterId) => {
  let successCount = 0;
  const errors = [];

  // Group by provided ID and Email for bulk checking
  const providedIds = suppliersArray.filter(s => s.id).map(s => parseInt(s.id, 10));
  const providedEmails = suppliersArray.map(s => s.email.toLowerCase());

  // Fetch existing by IDs and Emails in one go
  const [existingById, existingByEmail] = await Promise.all([
    providedIds.length > 0 
      ? prisma.supplier.findMany({ where: { id: { in: providedIds }, deletedAt: null } })
      : [],
    providedEmails.length > 0
      ? prisma.supplier.findMany({ where: { email: { in: providedEmails }, deletedAt: null } })
      : []
  ]);

  const existingIdMap = new Map(existingById.map(s => [s.id, s]));
  const existingEmailMap = new Map(existingByEmail.map(s => [s.email.toLowerCase(), s]));

  const toCreate = [];
  const toUpdate = [];

  for (const data of suppliersArray) {
    const parsedId = data.id ? parseInt(data.id, 10) : null;
    const emailLower = data.email.toLowerCase();
    
    let shouldUpdate = false;

    if (parsedId && existingIdMap.has(parsedId)) {
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      toUpdate.push({ data, parsedId });
    } else {
      // Create path
      if (existingEmailMap.has(emailLower)) {
        errors.push({ email: data.email, error: 'A supplier with this email already exists' });
        continue;
      }
      // Also prevent duplicates within the batch itself
      if (toCreate.find(item => item.email.toLowerCase() === emailLower)) {
        errors.push({ email: data.email, error: 'Duplicate email in the import file' });
        continue;
      }

      toCreate.push({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        company: data.company || null,
        address: data.address || null,
        categories: data.categories || [],
        createdById: updaterId,
        isActive: data.isActive !== undefined ? data.isActive : true
      });
    }
  }

  // Bulk create
  if (toCreate.length > 0) {
    try {
      const createResult = await prisma.supplier.createMany({
        data: toCreate,
        skipDuplicates: true
      });
      successCount += createResult.count || toCreate.length;
    } catch (err) {
      errors.push({ error: `Failed to bulk create new suppliers: ${err.message}` });
    }
  }

  // Bulk update using transactions
  if (toUpdate.length > 0) {
    try {
      const updatePromises = toUpdate.map(item => 
        prisma.supplier.update({
          where: { id: item.parsedId },
          data: {
            name: item.data.name,
            email: item.data.email,
            phone: item.data.phone || null,
            company: item.data.company || null,
            address: item.data.address || null,
            categories: item.data.categories !== undefined ? item.data.categories : [],
            isActive: item.data.isActive !== undefined ? item.data.isActive : true,
            updatedById: updaterId
          }
        })
      );
      
      // Run updates in chunks to avoid overwhelming the DB
      const chunkSize = 100;
      for (let i = 0; i < updatePromises.length; i += chunkSize) {
        const chunk = updatePromises.slice(i, i + chunkSize);
        await prisma.$transaction(chunk);
        successCount += chunk.length;
      }
    } catch (err) {
      errors.push({ error: `Failed to update existing suppliers: ${err.message}` });
    }
  }

  return { successCount, errors };
};

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  bulkImportSuppliers,
  executeBulkImportSuppliersJob
};
