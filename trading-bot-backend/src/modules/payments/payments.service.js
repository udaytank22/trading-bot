const prisma = require('../../prisma/client');

const { getPaginationParams } = require('../../utils/queryHelper');
const { notifyRole, notifyUser } = require('../notifications/notifications.service');

/**
 * Get all payments
 */
const getAllPayments = async (query = {}) => {
  const where = { deletedAt: null };
  const { skip, take } = getPaginationParams(query);

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        invoice: true,
        bankAccount: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    }),
    prisma.payment.count({ where })
  ]);

  return { data: payments, total };
};

/**
 * Get payment by ID
 */
const getPaymentById = async (id) => {
  return await prisma.payment.findFirst({
    where: { id, deletedAt: null },
    include: {
      invoice: true,
      bankAccount: true
    }
  });
};

/**
 * Log a payment and adjust invoice balance
 */
const createPayment = async (data, creatorId) => {
  let invoice;
  return await prisma.$transaction(async (tx) => {
    invoice = await tx.invoice.findUnique({
      where: { id: data.invoiceId }
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const payAmt = parseFloat(data.amount);
    const newPaid = invoice.paidAmount.toNumber() + payAmt;
    const newPending = invoice.total.toNumber() - newPaid;

    let invoiceStatus = 'SENT';
    if (newPending <= 0) {
      invoiceStatus = 'PAID';
    } else if (newPaid > 0) {
      invoiceStatus = 'PARTIALLY_PAID';
    }

    // Write payment
    const payment = await tx.payment.create({
      data: {
        invoiceId: data.invoiceId,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        amount: payAmt,
        paymentMode: data.paymentMode,
        bankAccountId: data.bankAccountId,
        transactionReference: data.transactionReference || null,
        notes: data.notes || null,
        createdById: creatorId
      }
    });

    // Update invoice balances
    await tx.invoice.update({
      where: { id: data.invoiceId },
      data: {
        paidAmount: newPaid,
        pendingAmount: newPending > 0 ? newPending : 0,
        status: invoiceStatus
      }
    });

    return payment;
  }).then(async (payment) => {
    await notifyRole('Admin', {
      title: 'Payment Recorded',
      message: `A payment of $${payment.amount} has been logged for Invoice ${invoice.invoiceNumber}.`,
      type: 'PAYMENT_CREATED',
      relatedModule: 'PAYMENT',
      relatedRecordId: payment.id
    });
    return payment;
  });
};

/**
 * Delete a payment entry and revert invoice balances
 */
const deletePayment = async (id, updaterId) => {
  let invoice;
  return await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    invoice = await tx.invoice.findUnique({
      where: { id: payment.invoiceId }
    });

    if (!invoice) {
      throw new Error('Invoice associated with this payment was not found');
    }

    const payAmt = payment.amount.toNumber();
    const newPaid = invoice.paidAmount.toNumber() - payAmt;
    const newPending = invoice.total.toNumber() - newPaid;

    let invoiceStatus = 'SENT';
    if (newPaid <= 0) {
      invoiceStatus = 'SENT';
    } else if (newPending > 0) {
      invoiceStatus = 'PARTIALLY_PAID';
    }

    // Soft delete payment
    const deleted = await tx.payment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        updatedById: updaterId
      }
    });

    // Revert invoice stats
    await tx.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        paidAmount: newPaid >= 0 ? newPaid : 0,
        pendingAmount: newPending,
        status: invoiceStatus
      }
    });

    return deleted;
  }).then(async (deleted) => {
    await notifyRole('Admin', {
      title: 'Payment Reverted',
      message: `Payment of $${deleted.amount} for Invoice ${invoice.invoiceNumber} has been deleted and reverted.`,
      type: 'PAYMENT_DELETED',
      relatedModule: 'PAYMENT',
      relatedRecordId: deleted.id
    });
    return deleted;
  });
};

module.exports = {
  getAllPayments,
  getPaymentById,
  createPayment,
  deletePayment
};
