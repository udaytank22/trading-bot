const prisma = require('../../prisma/client');

/**
 * Get all active products
 */
const getAllProducts = async (query = {}) => {
  const { page, pageSize, paginate } = query;
  const where = { deletedAt: null };

  if (paginate === 'false') {
    const products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' }
    });
    return { data: products, total: products.length };
  }

  const skip = page && pageSize ? (parseInt(page) - 1) * parseInt(pageSize) : undefined;
  const take = pageSize ? parseInt(pageSize) : undefined;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take
    }),
    prisma.product.count({ where })
  ]);

  return { data: products, total };
};

/**
 * Get product by ID
 */
const getProductById = async (id) => {
  return await prisma.product.findFirst({
    where: { id: parseInt(id, 10), deletedAt: null }
  });
};

/**
 * Create product
 */
const createProduct = async (data, creatorId) => {
  // Check for duplicate product (by sku)
  const existingProduct = await prisma.product.findFirst({
    where: {
      sku: data.sku,
      deletedAt: null
    }
  });

  if (existingProduct) {
    const err = new Error(`A product with this SKU already exists.`);
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
  const productId = parseInt(id, 10);
  // Check for duplicate product (by sku) excluding the current product
  const existingProduct = await prisma.product.findFirst({
    where: {
      id: { not: productId },
      sku: data.sku,
      deletedAt: null
    }
  });

  if (existingProduct) {
    const err = new Error(`A product with this SKU already exists.`);
    err.statusCode = 400;
    throw err;
  }

  return await prisma.product.update({
    where: { id: productId },
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
    where: { id: parseInt(id, 10) },
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
