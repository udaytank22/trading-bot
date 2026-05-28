const prisma = require('../../prisma/client');

/**
 * Get all active products
 */
const getAllProducts = async () => {
  return await prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' }
  });
};

/**
 * Get product by ID
 */
const getProductById = async (id) => {
  return await prisma.product.findFirst({
    where: { id, deletedAt: null }
  });
};

/**
 * Create product
 */
const createProduct = async (data, creatorId) => {
  return await prisma.product.create({
    data: {
      name: data.name,
      sku: data.sku,
      category: data.category || null,
      unit: data.unit || null,
      sellingPrice: data.sellingPrice,
      purchasePrice: data.purchasePrice,
      createdById: creatorId,
      isActive: data.isActive !== undefined ? data.isActive : true
    }
  });
};

/**
 * Update product
 */
const updateProduct = async (id, data, updaterId) => {
  return await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      sku: data.sku,
      category: data.category,
      unit: data.unit,
      sellingPrice: data.sellingPrice,
      purchasePrice: data.purchasePrice,
      isActive: data.isActive,
      updatedById: updaterId
    }
  });
};

/**
 * Soft delete product
 */
const deleteProduct = async (id, updaterId) => {
  return await prisma.product.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
      updatedById: updaterId
    }
  });
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
