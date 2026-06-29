const prisma = require('../../prisma/client');

const { getPaginationParams } = require('../../utils/queryHelper');
const { notifyRole, notifyUser } = require('../notifications/notifications.service');

/**
 * Get all shipments
 */
const getAllShipments = async (query = {}) => {
  const where = { deletedAt: null };

  const { skip, take } = getPaginationParams(query);

  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      include: {
        inquiry: {
          include: {
            clientQuotations: {
              include: { items: { include: { inquiryItem: true } } }
            }
          }
        },
        purchaseOrder: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        },
        supplier: true,
        client: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    }),
    prisma.shipment.count({ where })
  ]);

  return { data: shipments, total };
};

/**
 * Get shipment by ID
 */
const getShipmentById = async (id) => {
  return await prisma.shipment.findFirst({
    where: { id: parseInt(id, 10), deletedAt: null },
    include: {
      inquiry: {
        include: {
          clientQuotations: {
            include: { items: { include: { inquiryItem: true } } }
          }
        }
      },
      purchaseOrder: {
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      },
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

  const createdShipment = await prisma.shipment.create({
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

  await notifyRole('Admin', {
    title: 'New Shipment Created',
    message: `Shipment ${shipmentNumber} has been created.`,
    type: 'SHIPMENT_CREATED',
    relatedModule: 'SHIPMENT',
    relatedRecordId: createdShipment.id
  });

  return createdShipment;
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

  const updatedShipment = await prisma.shipment.update({
    where: { id: parseInt(id, 10) },
    data: updateData
  });

  if (data.currentStatus) {
    await notifyRole('Admin', {
      title: 'Shipment Status Updated',
      message: `Shipment ${updatedShipment.shipmentNumber} is now ${data.currentStatus}.`,
      type: 'SHIPMENT_STATUS_UPDATED',
      relatedModule: 'SHIPMENT',
      relatedRecordId: updatedShipment.id
    });
  }

  return updatedShipment;
};

/**
 * Soft delete shipment
 */
const deleteShipment = async (id, updaterId) => {
  return await prisma.shipment.update({
    where: { id: parseInt(id, 10) },
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
