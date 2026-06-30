const prisma = require('../../prisma/client');

const { getPaginationParams } = require('../../utils/queryHelper');

/**
 * Get all active products
 */
const getAllProducts = async (query = {}) => {
  const where = { deletedAt: null };

  const { skip, take } = getPaginationParams(query);

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
  // Check for duplicate product (by impa)
  const existingProduct = await prisma.product.findFirst({
    where: {
      impa: data.impa,
      deletedAt: null
    }
  });

  if (existingProduct) {
    const err = new Error(`A product with this IMPA already exists.`);
    err.statusCode = 400;
    throw err;
  }

  return await prisma.product.create({
    data: {
      name: data.name,
      impa: data.impa,
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
  // Check for duplicate product (by impa) excluding the current product
  const existingProduct = await prisma.product.findFirst({
    where: {
      id: { not: productId },
      impa: data.impa,
      deletedAt: null
    }
  });

  if (existingProduct) {
    const err = new Error(`A product with this IMPA already exists.`);
    err.statusCode = 400;
    throw err;
  }

  return await prisma.product.update({
    where: { id: productId },
    data: {
      name: data.name,
      impa: data.impa,
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
 * Bulk upsert products (queues a job)
 */
const bulkUpsertProducts = async (products, creatorId) => {
  const { results, errors } = await executeBulkUpsertProductsJob(products, creatorId);
  return { results, errors, status: 'completed' };
};

/**
 * Execute bulk upsert job (called by Worker)
 */
const executeBulkUpsertProductsJob = async (products, creatorId) => {
  let successCount = 0;
  const errors = [];

  const providedImpas = products.filter(p => p.impa).map(p => p.impa);

  const existingByImpa = await prisma.product.findMany({
    where: { impa: { in: providedImpas }, deletedAt: null }
  });

  const existingImpaMap = new Map(existingByImpa.map(p => [p.impa, p]));

  const toCreate = [];
  const toUpdate = [];

  for (const item of products) {
    if (!item.name || !item.impa) {
      errors.push({ impa: item.impa || null, error: 'Name and IMPA are required' });
      continue;
    }

    const existing = existingImpaMap.get(item.impa);
    
    if (existing) {
      toUpdate.push({ data: item, existingId: existing.id, existing });
    } else {
      if (toCreate.find(p => p.impa === item.impa)) {
        errors.push({ impa: item.impa, error: 'Duplicate IMPA in the import file' });
        continue;
      }

      toCreate.push({
        name: item.name,
        impa: item.impa,
        category: item.category || null,
        unit: item.unit || null,
        sellingPrice: item.sellingPrice !== undefined ? parseFloat(item.sellingPrice) : 0,
        purchasePrice: item.purchasePrice !== undefined ? parseFloat(item.purchasePrice) : 0,
        isActive: item.isActive !== undefined ? item.isActive : true,
        createdById: creatorId
      });
    }
  }

  if (toCreate.length > 0) {
    try {
      const createResult = await prisma.product.createMany({
        data: toCreate,
        skipDuplicates: true
      });
      successCount += createResult.count || toCreate.length;
    } catch (err) {
      errors.push({ error: `Failed to bulk create new products: ${err.message}` });
    }
  }

  if (toUpdate.length > 0) {
    try {
      const updatePromises = toUpdate.map(item => 
        prisma.product.update({
          where: { id: item.existingId },
          data: {
            name: item.data.name,
            category: item.data.category || null,
            unit: item.data.unit || null,
            sellingPrice: item.data.sellingPrice !== undefined ? parseFloat(item.data.sellingPrice) : item.existing.sellingPrice,
            purchasePrice: item.data.purchasePrice !== undefined ? parseFloat(item.data.purchasePrice) : item.existing.purchasePrice,
            isActive: item.data.isActive !== undefined ? item.data.isActive : item.existing.isActive,
            updatedById: creatorId
          }
        })
      );
      
      const chunkSize = 100;
      for (let i = 0; i < updatePromises.length; i += chunkSize) {
        const chunk = updatePromises.slice(i, i + chunkSize);
        await prisma.$transaction(chunk);
        successCount += chunk.length;
      }
    } catch (err) {
      errors.push({ error: `Failed to update existing products: ${err.message}` });
    }
  }

  return { results: { successCount }, errors };
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkUpsertProducts,
  executeBulkUpsertProductsJob
};
