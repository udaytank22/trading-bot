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
  // Check for duplicate product (by sku or name)
  const existingProduct = await prisma.product.findFirst({
    where: {
      OR: [
        { sku: data.sku },
        { name: data.name }
      ],
      deletedAt: null
    }
  });

  if (existingProduct) {
    const err = new Error(`A product with this ${existingProduct.sku === data.sku ? 'SKU' : 'name'} already exists.`);
    err.statusCode = 400;
    throw err;
  }

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
  // Check for duplicate product (by sku or name) excluding the current product
  const existingProduct = await prisma.product.findFirst({
    where: {
      id: { not: id },
      OR: [
        { sku: data.sku },
        { name: data.name }
      ],
      deletedAt: null
    }
  });

  if (existingProduct) {
    const err = new Error(`A product with this ${existingProduct.sku === data.sku ? 'SKU' : 'name'} already exists.`);
    err.statusCode = 400;
    throw err;
  }

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

/**
 * Bulk upsert products
 */
const bulkUpsertProducts = async (products, updaterId) => {
  return await prisma.$transaction(
    products.map(data => {
      if (data.id) {
        return prisma.product.update({
          where: { id: data.id },
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
      } else {
        return prisma.product.create({
          data: {
            name: data.name,
            sku: data.sku,
            category: data.category || null,
            unit: data.unit || null,
            sellingPrice: data.sellingPrice,
            purchasePrice: data.purchasePrice,
            createdById: updaterId,
            isActive: data.isActive !== undefined ? data.isActive : true
          }
        });
      }
    })
  );
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkUpsertProducts
};
