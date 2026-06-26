const prisma = require('../../prisma/client');

/**
 * Get all active products
 */
const getAllProducts = async (query = {}) => {
  const { page, pageSize, paginate } = query;
  const where = { deletedAt: null };


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
const bulkUpsertProducts = async (products, creatorId) => {
  const results = [];
  const errors = [];

  for (const item of products) {
    try {
      if (!item.name || !item.sku) {
        errors.push({ sku: item.sku || null, error: 'Name and SKU are required' });
        continue;
      }

      const existing = await prisma.product.findFirst({
        where: { sku: item.sku, deletedAt: null }
      });

      let product;
      if (existing) {
        product = await prisma.product.update({
          where: { id: existing.id },
          data: {
            name: item.name,
            category: item.category || null,
            unit: item.unit || null,
            sellingPrice: item.sellingPrice !== undefined ? parseFloat(item.sellingPrice) : existing.sellingPrice,
            purchasePrice: item.purchasePrice !== undefined ? parseFloat(item.purchasePrice) : existing.purchasePrice,
            isActive: item.isActive !== undefined ? item.isActive : existing.isActive,
            updatedById: creatorId
          }
        });
      } else {
        product = await prisma.product.create({
          data: {
            name: item.name,
            sku: item.sku,
            category: item.category || null,
            unit: item.unit || null,
            sellingPrice: item.sellingPrice !== undefined ? parseFloat(item.sellingPrice) : 0,
            purchasePrice: item.purchasePrice !== undefined ? parseFloat(item.purchasePrice) : 0,
            isActive: item.isActive !== undefined ? item.isActive : true,
            createdById: creatorId
          }
        });
      }

      results.push(product);
    } catch (err) {
      errors.push({ sku: item.sku || null, error: err.message });
    }
  }

  return { results, errors };
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkUpsertProducts
};
