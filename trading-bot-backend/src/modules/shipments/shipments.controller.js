const service = require('./shipments.service');
const { sendSuccess, sendError } = require('../../utils/response');

const { createNotification } = require('../notifications/notifications.service');

/**
 * Get all shipments
 */
const getShipments = async (req, res) => {
  const { data, total } = await service.getAllShipments(req.query);
  const meta = {
    totalItems: total,
    currentPage: req.query.page ? parseInt(req.query.page) : 1,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize) : total,
    totalPages: req.query.pageSize ? Math.ceil(total / parseInt(req.query.pageSize)) : 1
  };
  return sendSuccess(res, 'Shipments list retrieved successfully', data, 200, meta);
};

/**
 * Get shipment by ID
 */
const getShipment = async (req, res) => {
  const shipment = await service.getShipmentById(req.params.id);
  if (!shipment) {
    return sendError(res, 'Shipment not found', [], 404);
  }
  return sendSuccess(res, 'Shipment details retrieved successfully', shipment);
};

/**
 * Create a new shipment
 */
const createShipment = async (req, res) => {
  const shipment = await service.createShipment(req.body, req.user.id);

  

  return sendSuccess(res, 'Shipment created successfully', shipment, 201);
};

/**
 * Update shipment details
 */
const updateShipment = async (req, res) => {
  const old = await service.getShipmentById(req.params.id);
  if (!old) {
    return sendError(res, 'Shipment not found', [], 404);
  }

  const shipment = await service.updateShipment(req.params.id, req.body, req.user.id);

  

  // Trigger alert if status transitioned to DELIVERED
  if (req.body.currentStatus === 'DELIVERED' && old.currentStatus !== 'DELIVERED') {
    await createNotification({
      userId: req.user.id,
      title: 'Shipment Delivered',
      message: `Shipment logistics completed for ${shipment.shipmentNumber}. Ready for invoicing.`,
      type: 'supply',
      relatedModule: 'shipments',
      relatedRecordId: shipment.id
    });
  }

  return sendSuccess(res, 'Shipment updated successfully', shipment);
};

/**
 * Delete a shipment
 */
const deleteShipment = async (req, res) => {
  const old = await service.getShipmentById(req.params.id);
  if (!old) {
    return sendError(res, 'Shipment not found', [], 404);
  }

  await service.deleteShipment(req.params.id, req.user.id);

  

  return sendSuccess(res, 'Shipment deleted successfully');
};

module.exports = {
  getShipments,
  getShipment,
  createShipment,
  updateShipment,
  deleteShipment
};
