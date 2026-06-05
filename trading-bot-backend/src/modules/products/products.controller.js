const service = require('./products.service');
const { sendSuccess, sendError } = require('../../utils/response');
const { createAuditLog } = require('../auditLogs/auditLogs.service');

/**
 * Get all products
 */
const getProducts = async (req, res) => {
  const products = await service.getAllProducts();
  return sendSuccess(res, 'Products retrieved successfully', products);
};

/**
 * Get product by ID
 */
const getProduct = async (req, res) => {
  const product = await service.getProductById(req.params.id);
  if (!product) {
    return sendError(res, 'Product not found', [], 404);
  }
  return sendSuccess(res, 'Product details retrieved successfully', product);
};

/**
 * Create product
 */
const createProduct = async (req, res) => {
  const product = await service.createProduct(req.body, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'products',
    action: 'create',
    recordId: product.id,
    newValue: product,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return sendSuccess(res, 'Product created successfully', product, 201);
};

/**
 * Update product
 */
const updateProduct = async (req, res) => {
  const oldProduct = await service.getProductById(req.params.id);
  if (!oldProduct) {
    return sendError(res, 'Product not found', [], 404);
  }

  const product = await service.updateProduct(req.params.id, req.body, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'products',
    action: 'update',
    recordId: product.id,
    oldValue: oldProduct,
    newValue: product,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return sendSuccess(res, 'Product updated successfully', product);
};

/**
 * Delete product
 */
const deleteProduct = async (req, res) => {
  const oldProduct = await service.getProductById(req.params.id);
  if (!oldProduct) {
    return sendError(res, 'Product not found', [], 404);
  }

  await service.deleteProduct(req.params.id, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'products',
    action: 'delete',
    recordId: req.params.id,
    oldValue: oldProduct,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return sendSuccess(res, 'Product deleted successfully');
};

/**
 * Bulk upsert products
 */
const bulkUpsertProducts = async (req, res) => {
  if (!req.body.products || !Array.isArray(req.body.products)) {
    return sendError(res, 'Products array is required', [], 400);
  }

  const result = await service.bulkUpsertProducts(req.body.products, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'products',
    action: 'bulk_upsert',
    recordId: null,
    newValue: { count: result.length },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return sendSuccess(res, `Successfully processed ${result.length} products`, result, 201);
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkUpsertProducts
};
