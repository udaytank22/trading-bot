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
      id,
      deletedAt: null
    }
  });
};

const createVehicle = async (data) => {
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
  return await prisma.vehicle.update({
    where: { id },
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
    where: { id },
    data: {
      deletedAt: new Date()
    }
  });
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
};
