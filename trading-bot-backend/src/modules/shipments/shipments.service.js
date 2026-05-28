const prisma = require('../../prisma/client');

/**
 * Get all shipments
 */
const getAllShipments = async () => {
  return await prisma.shipment.findMany({
    where: { deletedAt: null },
    include: {
      inquiry: true,
      purchaseOrder: true,
      supplier: true,
      client: true
    },
    orderBy: { createdAt: 'desc' }
  });
};

/**
 * Get shipment by ID
 */
const getShipmentById = async (id) => {
  return await prisma.shipment.findFirst({
    where: { id, deletedAt: null },
    include: {
      inquiry: true,
      purchaseOrder: true,
      supplier: true,
      client: true
    }
  });
};

/**
 * Create shipment
 */
const createShipment = async (data, creatorId) => {
  const shCount = await prisma.shipment.count();
  const shipmentNumber = `SH-${1000 + shCount + 1}`;

  return await prisma.shipment.create({
    data: {
      shipmentNumber,
      inquiryId: data.inquiryId || null,
      purchaseOrderId: data.purchaseOrderId || null,
      supplierId: data.supplierId,
      clientId: data.clientId,
      cargoDetails: data.cargoDetails || '',
      vehicleDetails: data.vehicleDetails || null,
      driverDetails: data.driverDetails || null,
      loadingDate: data.loadingDate ? new Date(data.loadingDate) : null,
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
      currentStatus: data.currentStatus || 'PENDING',
      trackingRemarks: data.trackingRemarks || null,
      createdById: creatorId
    }
  });
};

/**
 * Update shipment logistics info or status
 */
const updateShipment = async (id, data, updaterId) => {
  const updateData = {
    updatedById: updaterId
  };

  if (data.cargoDetails !== undefined) updateData.cargoDetails = data.cargoDetails;
  if (data.vehicleDetails !== undefined) updateData.vehicleDetails = data.vehicleDetails;
  if (data.driverDetails !== undefined) updateData.driverDetails = data.driverDetails;
  if (data.loadingDate !== undefined) updateData.loadingDate = data.loadingDate ? new Date(data.loadingDate) : null;
  if (data.deliveryDate !== undefined) updateData.deliveryDate = data.deliveryDate ? new Date(data.deliveryDate) : null;
  if (data.currentStatus !== undefined) updateData.currentStatus = data.currentStatus;
  if (data.trackingRemarks !== undefined) updateData.trackingRemarks = data.trackingRemarks;

  return await prisma.shipment.update({
    where: { id },
    data: updateData
  });
};

/**
 * Soft delete shipment
 */
const deleteShipment = async (id, updaterId) => {
  return await prisma.shipment.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
      updatedById: updaterId
    }
  });
};

module.exports = {
  getAllShipments,
  getShipmentById,
  createShipment,
  updateShipment,
  deleteShipment
};
