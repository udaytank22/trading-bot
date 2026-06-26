const service = require('./suppliers.service');
const { sendSuccess, sendError } = require('../../utils/response');


/**
 * Get all suppliers
 */
const getSuppliers = async (req, res) => {
  const { data, total } = await service.getAllSuppliers(req.query);
  const meta = {
    totalItems: total,
    currentPage: req.query.page ? parseInt(req.query.page) : 1,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize) : total,
    totalPages: req.query.pageSize ? Math.ceil(total / parseInt(req.query.pageSize)) : 1
  };
  return sendSuccess(res, 'Suppliers retrieved successfully', data, 200, meta);
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

  

  return sendSuccess(res, 'Supplier deleted successfully');
};

/**
 * Bulk import suppliers
 */
const bulkImportSuppliers = async (req, res) => {
  const result = await service.bulkImportSuppliers(req.body.suppliers, req.user.id);
  
  

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
