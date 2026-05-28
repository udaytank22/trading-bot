const prisma = require('../../prisma/client');

/**
 * Get all invoices
 */
const getAllInvoices = async () => {
  return await prisma.invoice.findMany({
    where: { deletedAt: null },
    include: {
      client: true,
      inquiry: true,
      shipment: true,
      items: true,
      payments: true
    },
    orderBy: { createdAt: 'desc' }
  });
};

/**
 * Get invoice by ID
 */
const getInvoiceById = async (id) => {
  return await prisma.invoice.findFirst({
    where: { id, deletedAt: null },
    include: {
      client: true,
      inquiry: true,
      shipment: true,
      items: true,
      payments: {
        include: {
          bankAccount: true
        }
      }
    }
  });
};

/**
 * Create a new invoice
 */
const createInvoice = async (data, creatorId) => {
  return await prisma.$transaction(async (tx) => {
    const invCount = await tx.invoice.count();
    const invoiceNumber = `INV-${1000 + invCount + 1}`;

    const subtotal = parseFloat(data.subtotal);
    const tax = parseFloat(data.tax || 0);
    const discount = parseFloat(data.discount || 0);
    const total = subtotal + tax - discount;

    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        clientId: data.clientId,
        inquiryId: data.inquiryId || null,
        shipmentId: data.shipmentId || null,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        subtotal,
        tax,
        discount,
        total,
        paidAmount: 0,
        pendingAmount: total,
        status: data.status || 'DRAFT',
        createdById: creatorId
      }
    });

    if (data.items && data.items.length > 0) {
      await tx.invoiceItem.createMany({
        data: data.items.map((item) => ({
          invoiceId: invoice.id,
          description: item.description || '',
          quantity: parseInt(item.quantity, 10),
          unitPrice: parseFloat(item.unitPrice),
          totalPrice: parseFloat(item.totalPrice)
        }))
      });
    }

    return await tx.invoice.findUnique({
      where: { id: invoice.id },
      include: {
        client: true,
        items: true
      }
    });
  });
};

/**
 * Update invoice details
 */
const updateInvoice = async (id, data, updaterId) => {
  return await prisma.$transaction(async (tx) => {
    const old = await tx.invoice.findUnique({
      where: { id }
    });

    if (!old) {
      throw new Error('Invoice not found');
    }

    const updateData = {
      updatedById: updaterId
    };

    if (data.status) updateData.status = data.status;
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
    if (data.invoiceDate) updateData.invoiceDate = new Date(data.invoiceDate);
    
    const sub = data.subtotal !== undefined ? parseFloat(data.subtotal) : old.subtotal.toNumber();
    const txVal = data.tax !== undefined ? parseFloat(data.tax) : old.tax.toNumber();
    const disc = data.discount !== undefined ? parseFloat(data.discount) : old.discount.toNumber();
    
    if (data.subtotal !== undefined) updateData.subtotal = sub;
    if (data.tax !== undefined) updateData.tax = txVal;
    if (data.discount !== undefined) updateData.discount = disc;

    const total = sub + txVal - disc;
    updateData.total = total;
    updateData.pendingAmount = total - old.paidAmount.toNumber();

    const invoice = await tx.invoice.update({
      where: { id },
      data: updateData
    });

    if (data.items && data.items.length > 0) {
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id }
      });

      await tx.invoiceItem.createMany({
        data: data.items.map((item) => ({
          invoiceId: id,
          description: item.description || '',
          quantity: parseInt(item.quantity, 10),
          unitPrice: parseFloat(item.unitPrice),
          totalPrice: parseFloat(item.totalPrice)
        }))
      });
    }

    return await tx.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        items: true
      }
    });
  });
};

/**
 * Soft delete invoice
 */
const deleteInvoice = async (id, updaterId) => {
  return await prisma.invoice.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
      updatedById: updaterId
    }
  });
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice
};
