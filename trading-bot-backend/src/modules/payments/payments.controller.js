const service = require('./payments.service');
const { sendSuccess, sendError } = require('../../utils/response');

const { createNotification } = require('../notifications/notifications.service');

/**
 * Get all payments
 */
const getPayments = async (req, res) => {
  const payments = await service.getAllPayments();
  return sendSuccess(res, 'Payments list retrieved successfully', payments);
};

/**
 * Get payment by ID
 */
const getPayment = async (req, res) => {
  const payment = await service.getPaymentById(req.params.id);
  if (!payment) {
    return sendError(res, 'Payment record not found', [], 404);
  }
  return sendSuccess(res, 'Payment details retrieved successfully', payment);
};

/**
 * Log a payment
 */
const createPayment = async (req, res) => {
  try {
    const payment = await service.createPayment(req.body, req.user.id);

    

    await createNotification({
      userId: req.user.id,
      title: 'Payment Received',
      message: `A payment of ₹${payment.amount} has been logged in system.`,
      type: 'purchase-order',
      relatedModule: 'payments',
      relatedRecordId: payment.id
    });

    return sendSuccess(res, 'Payment recorded successfully', payment, 201);
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};

/**
 * Delete payment
 */
const deletePayment = async (req, res) => {
  const old = await service.getPaymentById(req.params.id);
  if (!old) {
    return sendError(res, 'Payment not found', [], 404);
  }

  try {
    await service.deletePayment(req.params.id, req.user.id);

    

    return sendSuccess(res, 'Payment deleted successfully');
  } catch (error) {
    return sendError(res, error.message, [], 400);
  }
};

module.exports = {
  getPayments,
  getPayment,
  createPayment,
  deletePayment
};
