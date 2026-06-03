const prisma = require('../../prisma/client');
const { createNotification, notifyAdmins } = require('../notifications/notifications.service');
const { createAuditLog } = require('../auditLogs/auditLogs.service');

/**
 * Helper to generate unique sequential inquiry number
 */
const generateInquiryNumber = async () => {
  const count = await prisma.inquiry.count();
  return `INQ-${1000 + count + 1}`;
};

/**
 * Get all inquiries with filtering, sorting, pagination
 */
const getAllInquiries = async (query = {}) => {
  const where = { deletedAt: null };

  if (query.status) {
    where.currentStatus = query.status;
  }

  if (query.clientId) {
    where.clientId = query.clientId;
  }

  return await prisma.inquiry.findMany({
    where,
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
      supplierQuotes: {
        include: {
          supplier: true,
          items: true
        }
      },
      assignedEmployee: {
        select: { id: true, email: true }
      },
      assignedTeamLead: {
        select: { id: true, email: true }
      },
      statusHistory: {
        orderBy: { createdAt: 'desc' }
      },
      clientQuotations: {
        include: {
          items: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

/**
 * Get details for a single inquiry
 */
const getInquiryById = async (id) => {
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
      }
    }
  });
};

/**
 * Create a new inquiry (PENDING)
 */
const createInquiry = async (data, creatorId) => {
  const inquiryNumber = await generateInquiryNumber();

  return await prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.create({
      data: {
        inquiryNumber,
        clientId: data.clientId,
        vesselName: data.vesselName || null,
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
      await tx.inquiryItem.createMany({
        data: data.items.map((item) => ({
          inquiryId: inquiry.id,
          productId: item.productId || null,
          description: item.description,
          quantity: parseInt(item.quantity, 10),
          unit: item.unit || null
        }))
      });
    }

    // Status history
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
 * Update basic details (not status)
 */
const updateInquiry = async (id, data, updaterId) => {
  return await prisma.inquiry.update({
    where: { id },
    data: {
      vesselName: data.vesselName,
      referenceNumber: data.referenceNumber,
      assignedEmployeeId: data.assignedEmployeeId,
      assignedTeamLeadId: data.assignedTeamLeadId,
      expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : undefined,
      remarks: data.remarks,
      updatedById: updaterId
    }
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

    // Update status
    const updated = await tx.inquiry.update({
      where: { id },
      data: { currentStatus: 'RFQ_READY', updatedById: userId }
    });

    // History
    await tx.inquiryStatusHistory.create({
      data: {
        inquiryId: id,
        fromStatus: 'PENDING',
        toStatus: 'RFQ_READY',
        changedById: userId,
        remarks: data.remarks || 'Stock check completed'
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

    // Automatically generate Client Quotation
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

    const inquiryItems = await tx.inquiryItem.findMany({ where: { inquiryId: id } });
    const inquiryItemMap = new Map(inquiryItems.map(item => [item.id, item]));

    for (const item of data.items) {
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
    const totalSellerCost = parseFloat(data.quoteAmount) || 0;
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

    // Update status to TL_REVIEW directly
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
        remarks: `Received supplier quote from supplier ID: ${data.supplierId}. Bypassed Client Quoting, sent to TL review.`
      }
    });

    return updated;
  });
};

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

/**
 * 5. Team Lead Review Action (TL_REVIEW -> ADMIN_APPROVAL / REJECTED)
 */
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
          },
          orderBy: { createdAt: 'desc' },
          take: 1
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

    // Get matched supplier
    const matchedSupplierQuote = inquiry.supplierQuotes[0];
    const clientQuote = inquiry.clientQuotations[0];

    if (!matchedSupplierQuote) {
      throw new Error('No supplier quotes found for this inquiry. Deal cannot be confirmed.');
    }

    // 1. Create Purchase Order (PO)
    const poCount = await tx.purchaseOrder.count();
    const poNumber = `PO-${1000 + poCount + 1}`;

    const po = await tx.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: matchedSupplierQuote.supplierId,
        clientId: inquiry.clientId,
        inquiryId: id,
        status: 'CONFIRMED',
        amount: matchedSupplierQuote.finalAmount,
        expectedDeliveryDate: inquiry.expectedDeliveryDate,
        emailStatus: 'SENT',
        createdById: userId
      }
    });

    // Link items to PO
    const inquiryItems = inquiry.items || [];

    for (const item of inquiryItems) {
      let productId = item.productId;
      if (!productId) {
        // Try to find product by description (matching the name)
        let product = await tx.product.findFirst({
          where: { name: item.description, deletedAt: null }
        });
        if (!product) {
          // Create product on the fly
          const skuCount = await tx.product.count();
          const sku = `SKU-${1000 + skuCount + 1}`;
          product = await tx.product.create({
            data: {
              name: item.description,
              sku,
              category: "General",
              unit: item.unit || "PCS",
              sellingPrice: matchedSupplierQuote.quoteAmount.toNumber() / inquiryItems.length, // estimate
              purchasePrice: matchedSupplierQuote.quoteAmount.toNumber() / inquiryItems.length, // estimate
            }
          });
        }
        productId = product.id;
      }

      // Find matching supplier quote item to get actual unit price
      const sqItem = matchedSupplierQuote.items?.find(sqi => sqi.inquiryItemId === item.id);
      const unitPrice = sqItem ? parseFloat(sqItem.unitPrice) : (item.quantity > 0 ? (matchedSupplierQuote.quoteAmount.toNumber() / item.quantity) : 0);
      const totalPrice = sqItem ? (unitPrice * item.quantity) : (matchedSupplierQuote.quoteAmount.toNumber() / inquiryItems.length);

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

    // 2. Create Supply Shipment
    const shCount = await tx.shipment.count();
    const shipmentNumber = `SH-${1000 + shCount + 1}`;

    await tx.shipment.create({
      data: {
        shipmentNumber,
        inquiryId: id,
        purchaseOrderId: po.id,
        supplierId: matchedSupplierQuote.supplierId,
        clientId: inquiry.clientId,
        cargoDetails: inquiryItems.map(i => `${i.description} (x${i.quantity})`).join(', '),
        currentStatus: 'PENDING',
        createdById: userId
      }
    });

    // 3. Update status
    const updated = await tx.inquiry.update({
      where: { id },
      data: { currentStatus: 'CONFIRMED', updatedById: userId }
    });

    // 4. History
    await tx.inquiryStatusHistory.create({
      data: {
        inquiryId: id,
        fromStatus: 'QUOTE_SENT',
        toStatus: 'CONFIRMED',
        changedById: userId,
        remarks: 'Deal confirmed. Spawned Purchase Order and Supply Shipment logistics.'
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

module.exports = {
  getAllInquiries,
  getInquiryById,
  createInquiry,
  updateInquiry,
  deleteInquiry,

  // Pipeline Actions
  stockCheck,
  sendRFQ,
  submitSupplierQuote,
  submitClientQuote,
  teamLeadApprove,
  adminApprove,
  finalVerify,
  clientDecision,
  confirmDeal,
  closeInquiry
};
