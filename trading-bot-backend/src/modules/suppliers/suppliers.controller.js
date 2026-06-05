const service = require('./suppliers.service');
const { sendSuccess, sendError } = require('../../utils/response');
const { createAuditLog } = require('../auditLogs/auditLogs.service');

/**
 * Get all suppliers
 */
const getSuppliers = async (req, res) => {
  const suppliers = await service.getAllSuppliers();
  return sendSuccess(res, 'Suppliers retrieved successfully', suppliers);
};

/**
 * Get supplier by ID
 */
const getSupplier = async (req, res) => {
  const supplier = await service.getSupplierById(req.params.id);
  if (!supplier) {
    return sendError(res, 'Supplier not found', [], 404);
  }
  return sendSuccess(res, 'Supplier details retrieved successfully', supplier);
};

/**
 * Create supplier
 */
const createSupplier = async (req, res) => {
  const supplier = await service.createSupplier(req.body, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'suppliers',
    action: 'create',
    recordId: supplier.id,
    newValue: supplier,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return sendSuccess(res, 'Supplier created successfully', supplier, 201);
};

/**
 * Update supplier
 */
const updateSupplier = async (req, res) => {
  const oldSupplier = await service.getSupplierById(req.params.id);
  if (!oldSupplier) {
    return sendError(res, 'Supplier not found', [], 404);
  }

  const supplier = await service.updateSupplier(req.params.id, req.body, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'suppliers',
    action: 'update',
    recordId: supplier.id,
    oldValue: oldSupplier,
    newValue: supplier,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return sendSuccess(res, 'Supplier updated successfully', supplier);
};

/**
 * Delete supplier
 */
const deleteSupplier = async (req, res) => {
  const oldSupplier = await service.getSupplierById(req.params.id);
  if (!oldSupplier) {
    return sendError(res, 'Supplier not found', [], 404);
  }

  await service.deleteSupplier(req.params.id, req.user.id);

  await createAuditLog({
    userId: req.user.id,
    module: 'suppliers',
    action: 'delete',
    recordId: req.params.id,
    oldValue: oldSupplier,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return sendSuccess(res, 'Supplier deleted successfully');
};

/**
 * Bulk import suppliers
 */
const bulkImportSuppliers = async (req, res) => {
  const result = await service.bulkImportSuppliers(req.body.suppliers, req.user.id);
  
  await createAuditLog({
    userId: req.user.id,
    module: 'suppliers',
    action: 'import',
    newValue: { count: result.successCount },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  return sendSuccess(res, `Successfully imported ${result.successCount} suppliers`, result);
};

module.exports = {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  bulkImportSuppliers
};
