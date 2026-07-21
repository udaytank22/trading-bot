const prisma = require('../../prisma/client');
const { createNotification, notifyAdmins } = require('../notifications/notifications.service');

const inventoryService = require('../inventory/inventory.service');

/**
 * Helper to generate unique sequential inquiry number
 */
const generateInquiryNumber = async () => {
  // Use the highest existing inquiry number to avoid duplicates from deletions or concurrent inserts
  const last = await prisma.inquiry.findFirst({
    orderBy: { id: 'desc' },
    select: { inquiryNumber: true }
  });

  let nextNum = 1001;
  if (last?.inquiryNumber) {
    const match = last.inquiryNumber.match(/INQ-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  // Ensure uniqueness — keep incrementing if this number already exists
  let candidate = `INQ-${nextNum}`;
  while (true) {
    const exists = await prisma.inquiry.findFirst({ where: { inquiryNumber: candidate } });
    if (!exists) break;
    nextNum += 1;
    candidate = `INQ-${nextNum}`;
  }

  return candidate;
};

const { getPaginationParams } = require('../../utils/queryHelper');

/**
 * Get all inquiries with filtering, sorting, pagination
 */
const getAllInquiries = async (query = {}) => {
  try {
    await autoCloseExpiredRFQs();
  } catch (err) {
    console.error("Failed to run autoCloseExpiredRFQs in getAllInquiries:", err.message);
  }

  const { page, pageSize, paginate, status, statuses, clientId, clientIds, search, excludeInventoryFulfilled } = query;

  // Guard against bracket-notation object injection
  for (const field of ['status', 'statuses', 'clientId', 'clientIds', 'search', 'excludeInventoryFulfilled']) {
    if (query[field] !== undefined && typeof query[field] === 'object') {
      const err = new Error(`Invalid filter parameter for field: ${field}`);
      err.statusCode = 400;
      throw err;
    }
  }

  const where = { deletedAt: null };

  if (excludeInventoryFulfilled === 'true') {
    where.inventoryFulfilled = false;
  }

  if (typeof search === 'string' && search.trim() !== '') {
    where.OR = [
      { inquiryNumber: { contains: search, mode: 'insensitive' } },
      { vesselName: { contains: search, mode: 'insensitive' } },
      { client: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }
  if (typeof status === 'string' && status.trim() !== '') {
    where.currentStatus = status;
  }

  if (typeof statuses === 'string' && statuses.trim() !== '') {
    const statusArray = statuses.split(',').map(s => s.trim());
    where.currentStatus = { in: statusArray };
  }

  if (typeof clientIds === 'string' && clientIds.trim() !== '') {
    const idsArray = clientIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
    where.clientId = { in: idsArray };
  } else if (typeof clientId === 'string' && clientId.trim() !== '') {
    where.clientId = parseInt(clientId, 10);
  }

  const { skip, take } = getPaginationParams(query);

  const includeConfig = {
    client: { select: { id: true, name: true, company: true, email: true } },
    assignedEmployee: { select: { id: true, email: true } },
    assignedTeamLead: { select: { id: true, email: true } },
    _count: {
      select: {
        items: true,
        supplierQuotes: true,
        statusHistory: true,
        clientQuotations: true,
        invoices: true
      }
    }
  };

  if (query.includeAll === 'true' || query.includeAll === true) {
    includeConfig.items = { include: { product: true } };
    includeConfig.suppliers = { include: { supplier: true } };
    includeConfig.supplierQuotes = { include: { items: true, supplier: true } };
    includeConfig.invoices = { select: { id: true, status: true } };
    includeConfig.shipments = { select: { currentStatus: true } };
  }

  const data = await prisma.inquiry.findMany({
    where,
    include: includeConfig,
    orderBy: { createdAt: 'desc' },
    skip,
    take
  });

  const total = await prisma.inquiry.count({ where });
  return { data, total };
};

/**
 * Get details for a single inquiry
 */
const getInquiryById = async (id) => {
  try {
    await autoCloseExpiredRFQs();
  } catch (err) {
    console.error("Failed to run autoCloseExpiredRFQs in getInquiryById:", err.message);
  }

  return await prisma.inquiry.findFirst({
    where: { id, deletedAt: null },
    include: {
      client: true,
      items: {
        include: {
          product: true
        }
      },
      suppliers: {
        include: {
          supplier: true
        }
      },
      assignedEmployee: {
        select: { id: true, email: true }
      },
      assignedTeamLead: {
        select: { id: true, email: true }
      },
      statusHistory: {
        include: {
          changedBy: { select: { id: true, email: true } }
        },
        orderBy: { createdAt: 'asc' }
      },
      supplierQuotes: {
        include: {
          supplier: true,
          items: true
        }
      },
      clientQuotations: {
        include: {
          items: true
        }
      },
      approvalLogs: {
        include: {
          approvedBy: { select: { id: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
      },
      purchaseOrders: {
        include: {
          supplier: true,
          items: true,
          shipments: {
            include: { invoices: true }
          }
        }
      },
      invoices: {
        include: {
          shipment: { include: { supplier: true } }
        }
      }
    }
  });
};

/**
 * Create a new inquiry (PENDING)
 * If ALL items are available in inventory → status becomes INVENTORY_FULFILLED
 * and inventory is automatically reserved.
 */
const createInquiry = async (data, creatorId) => {
  const inquiryNumber = await generateInquiryNumber();

  return await prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.create({
      data: {
        inquiryNumber,
        clientId: data.clientId,
        vesselName: data.vesselName || null,
        imoNumber: data.imoNumber || null,
        referenceNumber: data.referenceNumber || null,
        currentStatus: 'PENDING',
        assignedEmployeeId: data.assignedEmployeeId || null,
        assignedTeamLeadId: data.assignedTeamLeadId || null,
        expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null,
        remarks: data.remarks || null,
        createdById: creatorId
      }
    });

    // Create inquiry items
    if (data.items && data.items.length > 0) {
      const itemsToCreate = [];
      for (const item of data.items) {
        let pId = item.productId || null;
        if (!pId && item.description) {
          const matchedProd = await tx.product.findFirst({
            where: { name: item.description, deletedAt: null }
          });
          if (matchedProd) {
            pId = matchedProd.id;
          }
        }
        itemsToCreate.push({
          inquiryId: inquiry.id,
          productId: pId,
          description: item.description,
          quantity: parseInt(item.quantity, 10),
          unit: item.unit || null
        });
      }
      await tx.inquiryItem.createMany({
        data: itemsToCreate
      });
    }

    // Initial status history
    await tx.inquiryStatusHistory.create({
      data: {
        inquiryId: inquiry.id,
        fromStatus: 'NONE',
        toStatus: 'PENDING',
        changedById: creatorId,
        remarks: 'Inquiry initialized'
      }
    });

    return inquiry;
  });
};

/**
 * Create a public inquiry (anonymous / from client portal)
 */
const createPublicInquiry = async (data) => {
  // Find or create Client by email
  let client = await prisma.client.findFirst({
    where: { email: data.clientEmail, deletedAt: null }
  });

  if (!client) {
    client = await prisma.client.create({
      data: {
        name: data.clientName,
        email: data.clientEmail,
        phone: data.clientPhone || null,
        company: data.company || null,
        address: data.address || null
      }
    });
  }

  // Find a system/admin user for creation attribution
  const systemUser = await prisma.user.findFirst({
    where: { email: 'superadmin@trademind.com' }
  }) || await prisma.user.findFirst();

  const creatorId = systemUser ? systemUser.id : 1;

  // Generate Sequential Inquiry Number
  const inquiryNumber = await generateInquiryNumber();

  // Create inquiry and items in transaction
  const inquiry = await prisma.$transaction(async (tx) => {
    const inq = await tx.inquiry.create({
      data: {
        inquiryNumber,
        clientId: client.id,
        vesselName: data.vesselName || null,
        imoNumber: data.imoNumber || null,
        referenceNumber: data.referenceNumber || null,
        currentStatus: 'PENDING',
        expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null,
        remarks: data.remarks || null,
        createdById: creatorId
      }
    });

    if (data.items && data.items.length > 0) {
      const itemsToCreate = [];
      for (const item of data.items) {
        let pId = item.productId || null;
        if (!pId && item.description) {
          const matchedProd = await tx.product.findFirst({
            where: { name: item.description, deletedAt: null }
          });
          if (matchedProd) {
            pId = matchedProd.id;
          }
        }
        itemsToCreate.push({
          inquiryId: inq.id,
          productId: pId,
          description: item.description,
          quantity: parseInt(item.quantity, 10),
          unit: item.unit || null
        });
      }
      await tx.inquiryItem.createMany({
        data: itemsToCreate
      });
    }

    // Initial status history
    await tx.inquiryStatusHistory.create({
      data: {
        inquiryId: inq.id,
        fromStatus: 'NONE',
        toStatus: 'PENDING',
        changedById: creatorId,
        remarks: 'Inquiry submitted publicly by client'
      }
    });

    return inq;
  });

  return { inquiry, client, creatorId };
};



/**
 * Update basic details (not status)
 */
const updateInquiry = async (id, data, updaterId) => {
  const updateData = {
    vesselName: data.vesselName,
    imoNumber: data.imoNumber,
    referenceNumber: data.referenceNumber,
    assignedEmployeeId: data.assignedEmployeeId,
    assignedTeamLeadId: data.assignedTeamLeadId,
    expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : undefined,
    remarks: data.remarks,
    updatedById: updaterId
  };

  if (data.currentStatus !== undefined) {
    updateData.currentStatus = data.currentStatus;
  }

  return await prisma.inquiry.update({
    where: { id },
    data: updateData
  });
};

/**
 * Soft delete an inquiry
 */
const deleteInquiry = async (id, updaterId) => {
  return await prisma.inquiry.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
      updatedById: updaterId
    }
  });
};

/* ==========================================================================
   Pipeline Actions
   ========================================================================== */

/**
 * 1. Stock Check Action (PENDING -> RFQ_READY)
 */
const stockCheck = async (id, data, userId) => {
  return await prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({ where: { id } });
    if (!inquiry || inquiry.currentStatus !== 'PENDING') {
      throw new Error(`Inquiry status must be PENDING. Current: ${inquiry ? inquiry.currentStatus : 'NOT FOUND'}`);
    }

    // Link potential suppliers
    if (data.supplierIds && data.supplierIds.length > 0) {
      await tx.inquirySupplier.createMany({
        data: data.supplierIds.map((supplierId) => ({
          inquiryId: id,
          supplierId
        }))
      });
    }

    const isFullyInventory = !data.supplierIds || data.supplierIds.length === 0;
    const nextStatus = isFullyInventory ? 'TL_REVIEW' : 'RFQ_READY';

    // Update status
    const updated = await tx.inquiry.update({
      where: { id },
      data: {
        currentStatus: nextStatus,
        updatedById: userId,
        ...(isFullyInventory ? { inventoryFulfilled: true } : {})
      }
    });

    // History
    await tx.inquiryStatusHistory.create({
      data: {
        inquiryId: id,
        fromStatus: 'PENDING',
        toStatus: nextStatus,
        changedById: userId,
        remarks: data.remarks || (isFullyInventory ? 'Fulfilled via internal inventory' : 'Stock check completed')
      }
    });

    return updated;
  });
};

/**
 * 2. Send RFQ Action (RFQ_READY -> RFQ_SENT)
 */
const sendRFQ = async (id, data, userId) => {
  return await prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({ where: { id } });
    if (!inquiry || inquiry.currentStatus !== 'RFQ_READY') {
      throw new Error(`Inquiry status must be RFQ_READY. Current: ${inquiry ? inquiry.currentStatus : 'NOT FOUND'}`);
    }

    // Update status
    const updated = await tx.inquiry.update({
      where: { id },
      data: { currentStatus: 'RFQ_SENT', updatedById: userId }
    });

    // History
    await tx.inquiryStatusHistory.create({
      data: {
        inquiryId: id,
        fromStatus: 'RFQ_READY',
        toStatus: 'RFQ_SENT',
        changedById: userId,
        remarks: data.remarks || 'RFQ emails dispatched to suppliers'
      }
    });

    return updated;
  });
};

/**
 * 3. Receive Supplier Quote Action (RFQ_SENT -> TL_REVIEW)
 */
const submitSupplierQuote = async (id, data, userId) => {
  return await prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({ where: { id } });
    if (!inquiry || inquiry.currentStatus !== 'RFQ_SENT') {
      throw new Error(`Inquiry status must be RFQ_SENT. Current: ${inquiry ? inquiry.currentStatus : 'NOT FOUND'}`);
    }

    // Create supplier quote
    const quote = await tx.supplierQuote.create({
      data: {
        supplierId: data.supplierId,
        inquiryId: id,
        quoteAmount: data.quoteAmount,
        taxAmount: data.taxAmount,
        finalAmount: data.finalAmount,
        validityDate: data.validityDate ? new Date(data.validityDate) : null,
        documentAttachment: data.documentAttachment || null,
        createdById: userId
      }
    });

    // Link items
    if (data.items && data.items.length > 0) {
      await tx.supplierQuoteItem.createMany({
        data: data.items.map((item) => ({
          supplierQuoteId: quote.id,
          inquiryItemId: item.inquiryItemId,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          totalPrice: item.totalPrice
        }))
      });
    }

    // Log in history that supplier quote was received
    await tx.inquiryStatusHistory.create({
      data: {
        inquiryId: id,
        fromStatus: 'RFQ_SENT',
        toStatus: 'RFQ_SENT',
        changedById: userId,
        remarks: `Received supplier quote from supplier ID: ${data.supplierId}. RFQ remains open.`
      }
    });

    return inquiry;
  });
};

/**
 * Manually Close RFQ Action (RFQ_SENT -> TL_REVIEW)
 */
const closeRFQ = async (id, userId, remarks = 'RFQ closed manually') => {
  return await prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({ where: { id } });
    if (!inquiry || inquiry.currentStatus !== 'RFQ_SENT') {
      throw new Error(`Inquiry status must be RFQ_SENT. Current: ${inquiry ? inquiry.currentStatus : 'NOT FOUND'}`);
    }

    // Update status to TL_REVIEW
    const updated = await tx.inquiry.update({
      where: { id },
      data: { currentStatus: 'TL_REVIEW', updatedById: userId }
    });

    // History
    await tx.inquiryStatusHistory.create({
      data: {
        inquiryId: id,
        fromStatus: 'RFQ_SENT',
        toStatus: 'TL_REVIEW',
        changedById: userId,
        remarks
      }
    });

    return updated;
  });
};

/**
 * Select Supplier Quote ITEM Action (during TL_REVIEW)
 * Per-product selection: marks ONE SupplierQuoteItem as isSelected for a given inquiryItemId,
 * deselects all other SupplierQuoteItems for the same inquiryItemId, then rebuilds ClientQuotation
 * from the currently selected items across ALL supplier quotes.
 */
const selectSupplierQuoteItem = async (id, quoteItemId, userId) => {
  return await prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({
      where: { id },
      include: {
        items: true,
        supplierQuotes: {
          include: { items: true }
        }
      }
    });

    if (!inquiry) throw new Error('Inquiry not found');
    if (inquiry.currentStatus !== 'TL_REVIEW') {
      throw new Error(`Inquiry must be in TL_REVIEW. Current: ${inquiry.currentStatus}`);
    }

    // Find the target item
    const targetItem = await tx.supplierQuoteItem.findUnique({ where: { id: quoteItemId } });
    if (!targetItem) throw new Error('Supplier quote item not found');

    const inquiryItemId = targetItem.inquiryItemId;

    // Collect all SupplierQuoteItem ids for this inquiryItemId (across all quotes for this inquiry)
    const allItemIdsForProduct = inquiry.supplierQuotes
      .flatMap(q => q.items)
      .filter(i => i.inquiryItemId === inquiryItemId)
      .map(i => i.id);

    // Deselect all items for this product
    await tx.supplierQuoteItem.updateMany({
      where: { id: { in: allItemIdsForProduct } },
      data: { isSelected: false }
    });

    // Select the chosen item
    await tx.supplierQuoteItem.update({
      where: { id: quoteItemId },
      data: { isSelected: true }
    });

    // Now rebuild ClientQuotation from ALL currently selected items across all quotes
    // Gather the freshly-updated selection
    const updatedQuotes = await tx.supplierQuote.findMany({
      where: { inquiryId: id },
      include: { items: { where: { isSelected: true } }, supplier: true }
    });

    const selectedItems = updatedQuotes.flatMap(q =>
      q.items.map(i => ({ ...i, supplier: q.supplier }))
    );

    // Only rebuild if we have at least one selected item
    if (selectedItems.length === 0) {
      return inquiry;
    }

    // Clear old ClientQuotations
    const oldCqs = await tx.clientQuotation.findMany({ where: { inquiryId: id } });
    if (oldCqs.length > 0) {
      await tx.clientQuotationItem.deleteMany({ where: { clientQuotationId: { in: oldCqs.map(c => c.id) } } });
      await tx.clientQuotation.deleteMany({ where: { id: { in: oldCqs.map(c => c.id) } } });
    }

    // Build new ClientQuotation
    const quoteCount = await tx.clientQuotation.count();
    const quotationNumber = `QT-${1000 + quoteCount + 1}`;

    const defaultMarginEnv = parseFloat(process.env.DEFAULT_MARGIN) || 15;
    const minMargin = 10;
    const roundUpToTen = (num) => Math.ceil(num / 10) * 10;
    const getMargin = (productName, unitPrice) => {
      const name = (productName || '').toLowerCase();
      let margin = defaultMarginEnv;
      if (['bolt', 'nut', 'screw', 'fastener', 'washer'].some(kw => name.includes(kw))) margin = 18;
      else if (['pipe', 'rod', 'bar', 'sheet', 'plate'].some(kw => name.includes(kw))) margin = 12;
      let rule2 = 0;
      if (unitPrice < 100) rule2 = 25;
      else if (unitPrice <= 500) rule2 = 18;
      else if (unitPrice <= 2000) rule2 = 15;
      else rule2 = 12;
      return Math.max(margin, rule2);
    };

    const inquiryItemMap = new Map(inquiry.items.map(item => [item.id, item]));
    let totalClientAmount = 0;
    const clientItems = [];

    for (const item of selectedItems) {
      const dbItem = inquiryItemMap.get(item.inquiryItemId);
      const description = dbItem ? dbItem.description : '';
      const unitPrice = parseFloat(item.unitPrice);
      const qty = parseInt(item.quantity, 10);
      let finalMargin = getMargin(description, unitPrice);
      if (qty > 5000) finalMargin -= 4;
      else if (qty > 1000) finalMargin -= 2;
      finalMargin = Math.max(finalMargin, minMargin);
      const sellingPrice = roundUpToTen(unitPrice * (1 + finalMargin / 100));
      const totalPrice = sellingPrice * qty;
      totalClientAmount += totalPrice;
      clientItems.push({ inquiryItemId: item.inquiryItemId, sellingPrice, quantity: qty, totalPrice });
    }

    const totalSellerCost = selectedItems.reduce((s, i) => s + parseFloat(i.totalPrice || 0), 0);
    const averageMargin = totalSellerCost > 0 ? ((totalClientAmount - totalSellerCost) / totalSellerCost) * 100 : 0;
    const taxPercentage = 18;
    const finalClientAmount = totalClientAmount * 1.18;

    const quotation = await tx.clientQuotation.create({
      data: {
        inquiryId: id,
        quotationNumber,
        marginPercentage: parseFloat(averageMargin.toFixed(2)),
        discountPercentage: 0,
        taxPercentage,
        totalAmount: totalClientAmount,
        finalAmount: finalClientAmount,
        status: 'DRAFT',
        createdById: userId
      }
    });

    await tx.clientQuotationItem.createMany({
      data: clientItems.map(ci => ({ clientQuotationId: quotation.id, ...ci }))
    });

    return inquiry;
  });
};

/**
 * Batch version: Select multiple SupplierQuoteItems at once (TL_REVIEW).
 * selections = [{ quoteItemId: number }, ...]
 * For each product (inquiryItemId), only one SupplierQuoteItem may be selected.
 */
const selectSupplierQuoteItems = async (id, selections, userId) => {
  return await prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({
      where: { id },
      include: {
        items: true,
        supplierQuotes: { include: { items: true } }
      }
    });

    if (!inquiry) throw new Error('Inquiry not found');
    if (inquiry.currentStatus !== 'TL_REVIEW') {
      throw new Error(`Inquiry must be in TL_REVIEW. Current: ${inquiry.currentStatus}`);
    }

    // Build a map: inquiryItemId -> chosen quoteItemId from the selections
    const quoteItemIds = selections.map(s => parseInt(s.quoteItemId));

    // Fetch the actual items to get their inquiryItemIds
    const targetItems = await tx.supplierQuoteItem.findMany({
      where: { id: { in: quoteItemIds } }
    });

    const inquiryItemIdToChosenId = new Map();
    for (const t of targetItems) {
      inquiryItemIdToChosenId.set(t.inquiryItemId, t.id);
    }

    // Collect all SupplierQuoteItem ids for the affected products across all quotes
    const affectedInquiryItemIds = [...inquiryItemIdToChosenId.keys()];
    const allItemsForProducts = inquiry.supplierQuotes
      .flatMap(q => q.items)
      .filter(i => affectedInquiryItemIds.includes(i.inquiryItemId));

    // Deselect all items for the affected products
    await tx.supplierQuoteItem.updateMany({
      where: { id: { in: allItemsForProducts.map(i => i.id) } },
      data: { isSelected: false }
    });

    // Select the chosen items
    await tx.supplierQuoteItem.updateMany({
      where: { id: { in: quoteItemIds } },
      data: { isSelected: true }
    });

    // Gather ALL currently selected items (including any that were already selected before)
    const updatedQuotes = await tx.supplierQuote.findMany({
      where: { inquiryId: id },
      include: { items: { where: { isSelected: true } }, supplier: true }
    });

    const selectedItems = updatedQuotes.flatMap(q =>
      q.items.map(i => ({ ...i, supplier: q.supplier }))
    );

    if (selectedItems.length === 0) return inquiry;

    // Clear old ClientQuotations
    const oldCqs = await tx.clientQuotation.findMany({ where: { inquiryId: id } });
    if (oldCqs.length > 0) {
      await tx.clientQuotationItem.deleteMany({ where: { clientQuotationId: { in: oldCqs.map(c => c.id) } } });
      await tx.clientQuotation.deleteMany({ where: { id: { in: oldCqs.map(c => c.id) } } });
    }

    // Build new ClientQuotation
    const quoteCount = await tx.clientQuotation.count();
    const quotationNumber = `QT-${1000 + quoteCount + 1}`;

    const defaultMarginEnv = parseFloat(process.env.DEFAULT_MARGIN) || 15;
    const minMargin = 10;
    const roundUpToTen = (num) => Math.ceil(num / 10) * 10;
    const getMargin = (productName, unitPrice) => {
      const name = (productName || '').toLowerCase();
      let margin = defaultMarginEnv;
      if (['bolt', 'nut', 'screw', 'fastener', 'washer'].some(kw => name.includes(kw))) margin = 18;
      else if (['pipe', 'rod', 'bar', 'sheet', 'plate'].some(kw => name.includes(kw))) margin = 12;
      let rule2 = 0;
      if (unitPrice < 100) rule2 = 25;
      else if (unitPrice <= 500) rule2 = 18;
      else if (unitPrice <= 2000) rule2 = 15;
      else rule2 = 12;
      return Math.max(margin, rule2);
    };

    const inquiryItemMap = new Map(inquiry.items.map(item => [item.id, item]));
    let totalClientAmount = 0;
    const clientItems = [];

    for (const item of selectedItems) {
      const dbItem = inquiryItemMap.get(item.inquiryItemId);
      const description = dbItem ? dbItem.description : '';
      const unitPrice = parseFloat(item.unitPrice);
      const qty = parseInt(item.quantity, 10);
      let finalMargin = getMargin(description, unitPrice);
      if (qty > 5000) finalMargin -= 4;
      else if (qty > 1000) finalMargin -= 2;
      finalMargin = Math.max(finalMargin, minMargin);
      const sellingPrice = roundUpToTen(unitPrice * (1 + finalMargin / 100));
      const totalPrice = sellingPrice * qty;
      totalClientAmount += totalPrice;
      clientItems.push({ inquiryItemId: item.inquiryItemId, sellingPrice, quantity: qty, totalPrice });
    }

    const totalSellerCost = selectedItems.reduce((s, i) => s + parseFloat(i.totalPrice || 0), 0);
    const averageMargin = totalSellerCost > 0 ? ((totalClientAmount - totalSellerCost) / totalSellerCost) * 100 : 0;
    const taxPercentage = 18;
    const finalClientAmount = totalClientAmount * 1.18;

    const quotation = await tx.clientQuotation.create({
      data: {
        inquiryId: id,
        quotationNumber,
        marginPercentage: parseFloat(averageMargin.toFixed(2)),
        discountPercentage: 0,
        taxPercentage,
        totalAmount: totalClientAmount,
        finalAmount: finalClientAmount,
        status: 'DRAFT',
        createdById: userId
      }
    });

    await tx.clientQuotationItem.createMany({
      data: clientItems.map(ci => ({ clientQuotationId: quotation.id, ...ci }))
    });

    return inquiry;
  });
};

/**
 * Select Supplier Quote Action (during TL_REVIEW)
 * Marks isSelected: true, isSelected: false for others, and generates ClientQuotation draft
 */
const selectSupplierQuote = async (id, quoteId, userId) => {
  return await prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({
      where: { id },
      include: {
        items: true,
        supplierQuotes: true
      }
    });

    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    // 1. Mark isSelected
    await tx.supplierQuote.updateMany({
      where: { inquiryId: id },
      data: { isSelected: false }
    });

    const selectedQuote = await tx.supplierQuote.update({
      where: { id: quoteId },
      data: { isSelected: true },
      include: { items: true }
    });

    // 2. Clear old ClientQuotation & items for this inquiry
    const oldClientQuotations = await tx.clientQuotation.findMany({
      where: { inquiryId: id }
    });
    const oldCqIds = oldClientQuotations.map(cq => cq.id);
    if (oldCqIds.length > 0) {
      await tx.clientQuotationItem.deleteMany({
        where: { clientQuotationId: { in: oldCqIds } }
      });
      await tx.clientQuotation.deleteMany({
        where: { id: { in: oldCqIds } }
      });
    }

    // 3. Generate new ClientQuotation & items
    const quoteCount = await tx.clientQuotation.count();
    const quotationNumber = `QT-${1000 + quoteCount + 1}`;

    let totalClientAmount = 0;
    const clientItems = [];

    const defaultMarginEnv = parseFloat(process.env.DEFAULT_MARGIN) || 15;
    const minMargin = 10;

    const getMargin = (productName, unitPrice) => {
      const name = (productName || "").toLowerCase();
      let margin = defaultMarginEnv;

      const keywords12 = ["pipe", "rod", "bar", "sheet", "plate"];
      const keywords18 = ["bolt", "nut", "screw", "fastener", "washer"];

      if (keywords18.some(kw => name.includes(kw))) {
        margin = 18;
      } else if (keywords12.some(kw => name.includes(kw))) {
        margin = 12;
      }

      let rule2Margin = 0;
      if (unitPrice < 100) {
        rule2Margin = 25;
      } else if (unitPrice >= 100 && unitPrice <= 500) {
        rule2Margin = 18;
      } else if (unitPrice > 500 && unitPrice <= 2000) {
        rule2Margin = 15;
      } else if (unitPrice > 2000) {
        rule2Margin = 12;
      }

      return Math.max(margin, rule2Margin);
    };

    const roundUpToTen = (num) => {
      return Math.ceil(num / 10) * 10;
    };

    const inquiryItemMap = new Map(inquiry.items.map(item => [item.id, item]));

    for (const item of selectedQuote.items) {
      const dbItem = inquiryItemMap.get(item.inquiryItemId);
      const description = dbItem ? dbItem.description : '';
      const unitPrice = parseFloat(item.unitPrice);
      const qty = parseInt(item.quantity, 10);

      const margin = getMargin(description, unitPrice);
      let finalMargin = margin;
      if (qty > 5000) finalMargin -= 4;
      else if (qty > 1000) finalMargin -= 2;
      finalMargin = Math.max(finalMargin, minMargin);

      const sellingPrice = roundUpToTen(unitPrice * (1 + finalMargin / 100));
      const totalPrice = sellingPrice * qty;
      totalClientAmount += totalPrice;

      clientItems.push({
        inquiryItemId: item.inquiryItemId,
        sellingPrice,
        quantity: qty,
        totalPrice
      });
    }

    const taxPercentage = 18;
    const finalClientAmount = totalClientAmount * 1.18;
    const totalSellerCost = parseFloat(selectedQuote.quoteAmount) || 0;
    const averageMarginPercent = totalSellerCost > 0 ? ((totalClientAmount - totalSellerCost) / totalSellerCost) * 100 : 0;

    const quotation = await tx.clientQuotation.create({
      data: {
        inquiryId: id,
        quotationNumber,
        marginPercentage: parseFloat(averageMarginPercent.toFixed(2)),
        discountPercentage: 0,
        taxPercentage,
        totalAmount: totalClientAmount,
        finalAmount: finalClientAmount,
        status: 'DRAFT',
        createdById: userId
      }
    });

    await tx.clientQuotationItem.createMany({
      data: clientItems.map(ci => ({
        clientQuotationId: quotation.id,
        ...ci
      }))
    });

    // History
    await tx.inquiryStatusHistory.create({
      data: {
        inquiryId: id,
        fromStatus: 'TL_REVIEW',
        toStatus: 'TL_REVIEW',
        changedById: userId,
        remarks: `Selected supplier quote from supplier ID: ${selectedQuote.supplierId}. Client quotation ${quotationNumber} generated.`
      }
    });

    return inquiry;
  });
};

/**
 * Lazy check to automatically transition RFQs open for more than 3 days to TL_REVIEW
 */
async function autoCloseExpiredRFQs() {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const openRFQs = await prisma.inquiry.findMany({
    where: {
      currentStatus: 'RFQ_SENT',
      deletedAt: null
    },
    include: {
      statusHistory: {
        where: { toStatus: 'RFQ_SENT' },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  if (openRFQs.length === 0) return;

  const systemUser = await prisma.user.findFirst({
    where: { role: { name: 'Admin' } }
  });
  const systemUserId = systemUser ? systemUser.id : 1;

  for (const inq of openRFQs) {
    const rfqSentTransition = inq.statusHistory[0];
    const transitionTime = rfqSentTransition ? new Date(rfqSentTransition.createdAt) : new Date(inq.updatedAt);

    if (transitionTime < threeDaysAgo) {
      console.log(`Auto-closing expired RFQ for Inquiry ${inq.inquiryNumber}`);
      try {
        await closeRFQ(inq.id, systemUserId, 'Automatically closed after 3 days of opening');
      } catch (err) {
        console.error(`Failed to auto-close RFQ for Inquiry ${inq.id}:`, err.message);
      }
    }
  }
}

/**
 * 4. Build Client Quote Action (CLIENT_QUOTING -> TL_REVIEW)
 */
const submitClientQuote = async (id, data, userId) => {
  return await prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({ where: { id } });
    if (!inquiry || inquiry.currentStatus !== 'CLIENT_QUOTING') {
      throw new Error(`Inquiry status must be CLIENT_QUOTING. Current: ${inquiry ? inquiry.currentStatus : 'NOT FOUND'}`);
    }

    // Create quotation number
    const quoteCount = await tx.clientQuotation.count();
    const quotationNumber = `QT-${1000 + quoteCount + 1}`;

    const quotation = await tx.clientQuotation.create({
      data: {
        inquiryId: id,
        quotationNumber,
        marginPercentage: data.marginPercentage,
        discountPercentage: data.discountPercentage || 0,
        taxPercentage: data.taxPercentage,
        totalAmount: data.totalAmount,
        finalAmount: data.finalAmount,
        status: 'DRAFT',
        createdById: userId
      }
    });

    // Link quote items
    if (data.items && data.items.length > 0) {
      await tx.clientQuotationItem.createMany({
        data: data.items.map((item) => ({
          clientQuotationId: quotation.id,
          inquiryItemId: item.inquiryItemId,
          sellingPrice: item.sellingPrice,
          quantity: item.quantity,
          totalPrice: item.totalPrice
        }))
      });
    }

    // Update status
    const updated = await tx.inquiry.update({
      where: { id },
      data: { currentStatus: 'TL_REVIEW', updatedById: userId }
    });

    // History
    await tx.inquiryStatusHistory.create({
      data: {
        inquiryId: id,
        fromStatus: 'CLIENT_QUOTING',
        toStatus: 'TL_REVIEW',
        changedById: userId,
        remarks: `Client quotation ${quotationNumber} built. Sent to Team Lead for review.`
      }
    });

    return updated;
  });
};

const teamLeadApprove = async (id, data, userId) => {
  return await prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({ where: { id } });
    if (!inquiry || inquiry.currentStatus !== 'TL_REVIEW') {
      throw new Error(`Inquiry status must be TL_REVIEW. Current: ${inquiry ? inquiry.currentStatus : 'NOT FOUND'}`);
    }

    const isApproved = data.approved;
    const nextStatus = isApproved ? 'ADMIN_APPROVAL' : 'REJECTED';

    // Record approval log
    await tx.approvalLog.create({
      data: {
        inquiryId: id,
        approvedById: userId,
        role: 'Team Lead',
        status: isApproved ? 'APPROVED' : 'REJECTED',
        remarks: data.remarks || null
      }
    });

    // Update status
    const updated = await tx.inquiry.update({
      where: { id },
      data: { currentStatus: nextStatus, updatedById: userId }
    });

    // Update margins if override specified
    if (isApproved && data.overrideQuote) {
      const quotation = await tx.clientQuotation.findFirst({
        where: { inquiryId: id }
      });
      if (quotation) {
        await tx.clientQuotation.update({
          where: { id: quotation.id },
          data: {
            marginPercentage: data.overrideQuote.marginPercentage,
            discountPercentage: data.overrideQuote.discountPercentage,
            totalAmount: data.overrideQuote.totalAmount,
            finalAmount: data.overrideQuote.finalAmount
          }
        });

        if (data.overrideQuote.items && data.overrideQuote.items.length > 0) {
          for (const item of data.overrideQuote.items) {
            await tx.clientQuotationItem.updateMany({
              where: {
                clientQuotationId: quotation.id,
                inquiryItemId: item.inquiryItemId
              },
              data: {
                sellingPrice: parseFloat(item.sellingPrice),
                totalPrice: parseFloat(item.totalPrice)
              }
            });
          }
        }
      } else {
        const qNumber = `QT-${Date.now().toString().slice(-6)}`;
        const newQuotation = await tx.clientQuotation.create({
          data: {
            inquiryId: id,
            quotationNumber: qNumber,
            marginPercentage: data.overrideQuote.marginPercentage,
            discountPercentage: data.overrideQuote.discountPercentage,
            taxPercentage: 18,
            totalAmount: data.overrideQuote.totalAmount,
            finalAmount: data.overrideQuote.finalAmount,
            status: 'DRAFT',
            createdById: userId
          }
        });

        if (data.overrideQuote.items && data.overrideQuote.items.length > 0) {
          await tx.clientQuotationItem.createMany({
            data: data.overrideQuote.items.map(i => ({
              clientQuotationId: newQuotation.id,
              inquiryItemId: i.inquiryItemId,
              sellingPrice: parseFloat(i.sellingPrice),
              quantity: parseInt(i.quantity, 10) || 1,
              totalPrice: parseFloat(i.totalPrice)
            }))
          });
        }
      }
    }

    // History
    await tx.inquiryStatusHistory.create({
      data: {
        inquiryId: id,
        fromStatus: 'TL_REVIEW',
        toStatus: nextStatus,
        changedById: userId,
        remarks: data.remarks || (isApproved ? 'Team Lead approved deal' : 'Team Lead rejected deal')
      }
    });

    return updated;
  });
};

/**
 * 6. Admin Approval Action (ADMIN_APPROVAL -> EMPLOYEE_VERIFY / REJECTED)
 */
const adminApprove = async (id, data, userId) => {
  return await prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({ where: { id } });
    if (!inquiry || inquiry.currentStatus !== 'ADMIN_APPROVAL') {
      throw new Error(`Inquiry status must be ADMIN_APPROVAL. Current: ${inquiry ? inquiry.currentStatus : 'NOT FOUND'}`);
    }

    const isApproved = data.approved;
    const nextStatus = isApproved ? 'EMPLOYEE_VERIFY' : 'REJECTED';

    // Record approval log
    await tx.approvalLog.create({
      data: {
        inquiryId: id,
        approvedById: userId,
        role: 'Admin',
        status: isApproved ? 'APPROVED' : 'REJECTED',
        remarks: data.remarks || null
      }
    });

    // Update margins if override specified
    if (isApproved && data.overrideQuote) {
      const quotation = await tx.clientQuotation.findFirst({
        where: { inquiryId: id }
      });
      if (quotation) {
        await tx.clientQuotation.update({
          where: { id: quotation.id },
          data: {
            marginPercentage: data.overrideQuote.marginPercentage,
            discountPercentage: data.overrideQuote.discountPercentage,
            totalAmount: data.overrideQuote.totalAmount,
            finalAmount: data.overrideQuote.finalAmount
          }
        });

        if (data.overrideQuote.items && data.overrideQuote.items.length > 0) {
          for (const item of data.overrideQuote.items) {
            await tx.clientQuotationItem.updateMany({
              where: {
                clientQuotationId: quotation.id,
                inquiryItemId: item.inquiryItemId
              },
              data: {
                sellingPrice: parseFloat(item.sellingPrice),
                totalPrice: parseFloat(item.totalPrice)
              }
            });
          }
        }
      }
    }

    // Update status
    const updated = await tx.inquiry.update({
      where: { id },
      data: { currentStatus: nextStatus, updatedById: userId }
    });

    // History
    await tx.inquiryStatusHistory.create({
      data: {
        inquiryId: id,
        fromStatus: 'ADMIN_APPROVAL',
        toStatus: nextStatus,
        changedById: userId,
        remarks: data.remarks || (isApproved ? 'Admin approved pricing structure' : 'Admin rejected deal')
      }
    });

    return updated;
  });
};

/**
 * 7. Employee Final Verification Action (EMPLOYEE_VERIFY -> CLIENT_FINAL_APPROVAL)
 */
const finalVerify = async (id, data, userId) => {
  return await prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({ where: { id } });
    if (!inquiry || inquiry.currentStatus !== 'EMPLOYEE_VERIFY') {
      throw new Error(`Inquiry status must be EMPLOYEE_VERIFY. Current: ${inquiry ? inquiry.currentStatus : 'NOT FOUND'}`);
    }

    // Update status
    const updated = await tx.inquiry.update({
      where: { id },
      data: { currentStatus: 'CLIENT_FINAL_APPROVAL', updatedById: userId }
    });

    // Update Client Quotation status
    await tx.clientQuotation.updateMany({
      where: { inquiryId: id },
      data: { status: 'SENT' }
    });

    // History
    await tx.inquiryStatusHistory.create({
      data: {
        inquiryId: id,
        fromStatus: 'EMPLOYEE_VERIFY',
        toStatus: 'CLIENT_FINAL_APPROVAL',
        changedById: userId,
        remarks: data.remarks || 'Verification complete. Quote dispatched to client.'
      }
    });

    return updated;
  });
};

/**
 * 8. Client Final Decision Action (CLIENT_FINAL_APPROVAL -> QUOTE_SENT / CLOSED)
 */
const clientDecision = async (id, data, userId) => {
  return await prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({ where: { id } });
    if (!inquiry || inquiry.currentStatus !== 'CLIENT_FINAL_APPROVAL') {
      throw new Error(`Inquiry status must be CLIENT_FINAL_APPROVAL. Current: ${inquiry ? inquiry.currentStatus : 'NOT FOUND'}`);
    }

    const isAccepted = data.accepted;
    const nextStatus = isAccepted ? 'QUOTE_SENT' : 'CLOSED';

    // Update client quotation record status
    await tx.clientQuotation.updateMany({
      where: { inquiryId: id },
      data: { status: isAccepted ? 'APPROVED' : 'REJECTED' }
    });

    // Update status
    const updated = await tx.inquiry.update({
      where: { id },
      data: { currentStatus: nextStatus, updatedById: userId }
    });

    // History
    await tx.inquiryStatusHistory.create({
      data: {
        inquiryId: id,
        fromStatus: 'CLIENT_FINAL_APPROVAL',
        toStatus: nextStatus,
        changedById: userId,
        remarks: isAccepted ? 'Client accepted quotation' : 'Client rejected quotation. Deal closed.'
      }
    });

    return updated;
  });
};

/**
 * 9. Confirm Deal Action (QUOTE_SENT -> CONFIRMED)
 * Generates Purchase Order (PO) and Shipment/Supply records
 */
const confirmDeal = async (id, data, userId) => {
  return await prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({
      where: { id },
      include: {
        client: true,
        items: true,
        supplierQuotes: {
          include: {
            items: true
          }
        },
        clientQuotations: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!inquiry || inquiry.currentStatus !== 'QUOTE_SENT') {
      throw new Error(`Inquiry status must be QUOTE_SENT. Current: ${inquiry ? inquiry.currentStatus : 'NOT FOUND'}`);
    }

    const supplierQuotes = inquiry.supplierQuotes || [];

    // Map inquiryItemId -> selected SupplierQuoteItem
    const selectedItemMapping = new Map();

    for (const item of inquiry.items) {
      let chosenSqi = null;
      let chosenQuote = null;

      // Find if any SupplierQuoteItem has isSelected === true for this inquiry item
      for (const q of supplierQuotes) {
        const sqi = q.items?.find(sqi => sqi.inquiryItemId === item.id);
        if (sqi && sqi.isSelected) {
          chosenSqi = sqi;
          chosenQuote = q;
          break;
        }
      }

      // If not found, look for a selected quote as a whole
      if (!chosenSqi) {
        const selectedQuote = supplierQuotes.find(q => q.isSelected);
        if (selectedQuote) {
          const sqi = selectedQuote.items?.find(sqi => sqi.inquiryItemId === item.id);
          if (sqi) {
            chosenSqi = sqi;
            chosenQuote = selectedQuote;
          }
        }
      }

      // Fallback to first available quote item
      if (!chosenSqi) {
        for (const q of supplierQuotes) {
          const sqi = q.items?.find(sqi => sqi.inquiryItemId === item.id);
          if (sqi) {
            chosenSqi = sqi;
            chosenQuote = q;
            break;
          }
        }
      }

      if (chosenSqi && chosenQuote) {
        selectedItemMapping.set(item.id, {
          inquiryItem: item,
          supplierQuoteItem: chosenSqi,
          supplierQuote: chosenQuote,
          supplierId: chosenQuote.supplierId
        });
      }
    }

    if (selectedItemMapping.size === 0 && !inquiry.inventoryFulfilled) {
      throw new Error('No supplier quotes found for this inquiry. Deal cannot be confirmed.');
    }

    // Group by supplierId
    const supplierGroups = new Map();
    for (const [itemId, mapped] of selectedItemMapping.entries()) {
      const { supplierId } = mapped;
      if (!supplierGroups.has(supplierId)) {
        supplierGroups.set(supplierId, []);
      }
      supplierGroups.get(supplierId).push(mapped);
    }

    const basePoCount = await tx.purchaseOrder.count();
    const baseShCount = await tx.shipment.count();
    let poIndex = 0;
    let shIndex = 0;

    for (const [supplierId, groupItems] of supplierGroups.entries()) {
      const poNumber = `PO-${1000 + basePoCount + poIndex + 1}`;
      poIndex++;

      const poAmount = groupItems.reduce((sum, item) => sum + parseFloat(item.supplierQuoteItem.totalPrice || 0), 0);

      const po = await tx.purchaseOrder.create({
        data: {
          poNumber,
          supplierId,
          clientId: inquiry.clientId,
          inquiryId: id,
          status: 'CONFIRMED',
          amount: poAmount,
          expectedDeliveryDate: inquiry.expectedDeliveryDate,
          emailStatus: 'SENT',
          createdById: userId
        }
      });

      for (const mapped of groupItems) {
        const item = mapped.inquiryItem;
        const sqItem = mapped.supplierQuoteItem;

        let productId = item.productId;
        if (!productId) {
          let product = await tx.product.findFirst({
            where: { name: item.description, deletedAt: null }
          });
          if (!product) {
            const impaCount = await tx.product.count();
            const impa = `IMPA-${1000 + impaCount + 1}`;
            product = await tx.product.create({
              data: {
                name: item.description,
                impa,
                category: "General",
                unit: item.unit || "PCS",
                sellingPrice: parseFloat(sqItem.totalPrice) / item.quantity,
                purchasePrice: parseFloat(sqItem.unitPrice),
              }
            });
          }
          productId = product.id;
        }

        const unitPrice = parseFloat(sqItem.unitPrice);
        const totalPrice = parseFloat(sqItem.totalPrice);

        await tx.purchaseOrderItem.create({
          data: {
            purchaseOrderId: po.id,
            productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice,
            totalPrice
          }
        });
      }

      // Create Shipment for this PO
      const shipmentNumber = `SH-${1000 + baseShCount + shIndex + 1}`;
      shIndex++;

      await tx.shipment.create({
        data: {
          shipmentNumber,
          inquiryId: id,
          purchaseOrderId: po.id,
          supplierId,
          clientId: inquiry.clientId,
          cargoDetails: groupItems.map(m => `${m.inquiryItem.description} (x${m.inquiryItem.quantity})`).join(', '),
          currentStatus: 'PENDING',
          createdById: userId
        }
      });
    }

    if (inquiry.inventoryFulfilled) {
      const shipmentNumber = `SH-${1000 + baseShCount + shIndex + 1}`;
      shIndex++;

      await tx.shipment.create({
        data: {
          shipmentNumber,
          inquiryId: id,
          purchaseOrderId: null,
          supplierId: null,
          clientId: inquiry.clientId,
          cargoDetails: inquiry.items.map(m => `${m.description} (x${m.quantity})`).join(', '),
          currentStatus: 'PENDING',
          inventoryFulfilled: true,
          createdById: userId
        }
      });
    }

    // 3. Update status of the inquiry
    const updated = await tx.inquiry.update({
      where: { id },
      data: { currentStatus: 'CONFIRMED', updatedById: userId }
    });

    // 4. History log
    await tx.inquiryStatusHistory.create({
      data: {
        inquiryId: id,
        fromStatus: 'QUOTE_SENT',
        toStatus: 'CONFIRMED',
        changedById: userId,
        remarks: `Deal confirmed.` + (poIndex > 0 ? ` Generated ${poIndex} Purchase Order(s) and Shipment(s) for the selected vendors.` : ` Fulfilled via internal inventory.`)
      }
    });

    return updated;
  });
};

/**
 * 10. Close Inquiry Action (CONFIRMED -> CLOSED)
 */
const closeInquiry = async (id, data, userId) => {
  return await prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({ where: { id } });
    if (!inquiry || inquiry.currentStatus !== 'CONFIRMED') {
      throw new Error(`Inquiry status must be CONFIRMED. Current: ${inquiry ? inquiry.currentStatus : 'NOT FOUND'}`);
    }

    // Update status
    const updated = await tx.inquiry.update({
      where: { id },
      data: { currentStatus: 'CLOSED', updatedById: userId }
    });

    // History
    await tx.inquiryStatusHistory.create({
      data: {
        inquiryId: id,
        fromStatus: 'CONFIRMED',
        toStatus: 'CLOSED',
        changedById: userId,
        remarks: data.remarks || 'Deal successfully concluded'
      }
    });

    return updated;
  });
};

/**
 * Track an inquiry publicly by inquiryNumber
 */
const trackPublicInquiry = async (inquiryNumber) => {
  const inquiry = await prisma.inquiry.findFirst({
    where: { inquiryNumber },
    select: {
      inquiryNumber: true,
      currentStatus: true,
      createdAt: true,
      vesselName: true,
      inventoryFulfilled: true,
      client: {
        select: {
          name: true,
          company: true,
        }
      },
      items: {
        select: {
          description: true,
          quantity: true,
          unit: true
        }
      },
      shipments: {
        select: {
          currentStatus: true
        }
      }
    }
  });

  if (!inquiry) return null;

  // Derive aggregate status from shipments if present
  if (inquiry.shipments && inquiry.shipments.length > 0) {
    const STATUS_RANK = {
      'PENDING': 1,
      'ORDER PLACED': 1,
      'ORDERED': 1,
      'VEHICLE_ALLOTTED': 2,
      'LOADING': 2,
      'DISPATCHED': 3,
      'IN_TRANSIT': 3,
      'DELIVERED': 4,
      'OUT_FOR_DELIVERY': 5,
      'DELIVERED_TO_VESSEL': 6,
      'DELIVERED TO VESSEL': 6,
      'CHALLAN_RECEIVED': 7
    };
    
    let maxRank = 0;
    let advancedStatus = inquiry.currentStatus;

    inquiry.shipments.forEach(s => {
      const rank = STATUS_RANK[s.currentStatus] || 0;
      if (rank > maxRank) {
        maxRank = rank;
        advancedStatus = s.currentStatus;
      }
    });

    // If shipment is past CONFIRMED, use its status
    if (maxRank > 0 && inquiry.currentStatus === 'CONFIRMED') {
      inquiry.currentStatus = advancedStatus;
    }
  }

  return inquiry;
};

module.exports = {
  getAllInquiries,
  getInquiryById,
  createInquiry,
  createPublicInquiry,
  trackPublicInquiry,
  updateInquiry,
  deleteInquiry,

  // Pipeline Actions
  stockCheck,
  sendRFQ,
  submitSupplierQuote,
  closeRFQ,
  selectSupplierQuoteItem,
  selectSupplierQuoteItems,
  selectSupplierQuote,
  submitClientQuote,
  teamLeadApprove,
  adminApprove,
  finalVerify,
  clientDecision,
  confirmDeal,
  closeInquiry
};
