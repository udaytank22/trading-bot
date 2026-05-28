const prisma = require('../../prisma/client');

/**
 * Get all active clients
 */
const getAllClients = async () => {
  return await prisma.client.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' }
  });
};

/**
 * Get client by ID
 */
const getClientById = async (id) => {
  return await prisma.client.findFirst({
    where: { id, deletedAt: null }
  });
};

/**
 * Create client
 */
const createClient = async (data, creatorId) => {
  return await prisma.client.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      company: data.company || null,
      address: data.address || null,
      createdById: creatorId,
      isActive: data.isActive !== undefined ? data.isActive : true
    }
  });
};

/**
 * Update client
 */
const updateClient = async (id, data, updaterId) => {
  return await prisma.client.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      address: data.address,
      isActive: data.isActive,
      updatedById: updaterId
    }
  });
};

/**
 * Soft delete client
 */
const deleteClient = async (id, updaterId) => {
  return await prisma.client.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
      updatedById: updaterId
    }
  });
};

module.exports = {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
};
