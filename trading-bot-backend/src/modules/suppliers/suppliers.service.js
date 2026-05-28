const prisma = require('../../prisma/client');

/**
 * Get all active suppliers
 */
const getAllSuppliers = async () => {
  return await prisma.supplier.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' }
  });
};

/**
 * Get supplier by ID
 */
const getSupplierById = async (id) => {
  return await prisma.supplier.findFirst({
    where: { id, deletedAt: null }
  });
};

/**
 * Create supplier
 */
const createSupplier = async (data, creatorId) => {
  return await prisma.supplier.create({
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
 * Update supplier
 */
const updateSupplier = async (id, data, updaterId) => {
  return await prisma.supplier.update({
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
 * Soft delete supplier
 */
const deleteSupplier = async (id, updaterId) => {
  return await prisma.supplier.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
      updatedById: updaterId
    }
  });
};

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
};
