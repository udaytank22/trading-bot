const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllVehicles = async () => {
  return await prisma.vehicle.findMany({
    where: {
      deletedAt: null
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};

const getVehicleById = async (id) => {
  return await prisma.vehicle.findFirst({
    where: {
      id: parseInt(id, 10),
      deletedAt: null
    }
  });
};

const createVehicle = async (data) => {
  // Check for duplicate vehicle (by vehicle_no)
  const existingVehicle = await prisma.vehicle.findFirst({
    where: {
      vehicle_no: data.vehicle_no,
      deletedAt: null
    }
  });

  if (existingVehicle) {
    const err = new Error('A vehicle with this vehicle number already exists.');
    err.statusCode = 400;
    throw err;
  }

  return await prisma.vehicle.create({
    data: {
      vehicle_no: data.vehicle_no,
      type: data.type,
      capacity: data.capacity,
      driver_name: data.driver_name,
      phone: data.phone,
      documents: data.documents || [],
      status: data.status || 'Active'
    }
  });
};

const updateVehicle = async (id, data) => {
  const vehicleId = parseInt(id, 10);
  // Check for duplicate vehicle (by vehicle_no) excluding the current vehicle
  const existingVehicle = await prisma.vehicle.findFirst({
    where: {
      id: { not: vehicleId },
      vehicle_no: data.vehicle_no,
      deletedAt: null
    }
  });

  if (existingVehicle) {
    const err = new Error('A vehicle with this vehicle number already exists.');
    err.statusCode = 400;
    throw err;
  }

  return await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      vehicle_no: data.vehicle_no,
      type: data.type,
      capacity: data.capacity,
      driver_name: data.driver_name,
      phone: data.phone,
      documents: data.documents,
      status: data.status
    }
  });
};

const deleteVehicle = async (id) => {
  return await prisma.vehicle.update({
    where: { id: parseInt(id, 10) },
    data: {
      deletedAt: new Date()
    }
  });
};

/**
 * Bulk import vehicles (queues a job)
 */
const bulkImportVehicles = async (vehiclesArray) => {
  const { documentQueue } = require('../../utils/queue');
  const job = await documentQueue.add('bulkImportVehicles', { vehiclesArray });
  return { successCount: vehiclesArray.length, status: 'queued', jobId: job.id };
};

/**
 * Execute bulk import job (called by Worker)
 */
const executeBulkImportVehiclesJob = async (vehiclesArray) => {
  let successCount = 0;
  const errors = [];

  for (const data of vehiclesArray) {
    try {
      let shouldUpdate = false;
      if (data.id) {
        const existing = await prisma.vehicle.findFirst({
          where: { id: parseInt(data.id, 10), deletedAt: null }
        });
        shouldUpdate = !!existing;
      }

      if (shouldUpdate) {
        await prisma.vehicle.update({
          where: { id: parseInt(data.id, 10) },
          data: {
            vehicle_no: data.vehicle_no,
            type: data.type || null,
            capacity: data.capacity || null,
            driver_name: data.driver_name || null,
            phone: data.phone || null,
            status: data.status || 'Active'
          }
        });
      } else {
        // Check for duplicate vehicle_no before creating
        const duplicate = await prisma.vehicle.findFirst({
          where: { vehicle_no: data.vehicle_no, deletedAt: null }
        });
        if (duplicate) {
          errors.push({ vehicle_no: data.vehicle_no, error: 'A vehicle with this number already exists' });
          continue;
        }

        await prisma.vehicle.create({
          data: {
            vehicle_no: data.vehicle_no,
            type: data.type || null,
            capacity: data.capacity || null,
            driver_name: data.driver_name || null,
            phone: data.phone || null,
            documents: [],
            status: data.status || 'Active'
          }
        });
      }

      successCount++;
    } catch (err) {
      errors.push({ vehicle_no: data.vehicle_no || null, error: err.message });
    }
  }

  return { successCount, errors };
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  bulkImportVehicles,
  executeBulkImportVehiclesJob
};
