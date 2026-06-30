const service = require('./vehicles.service');
const { sendSuccess, sendError } = require('../../utils/response');

const getVehicles = async (req, res) => {
  const { data, total } = await service.getAllVehicles(req.query);
  const meta = {
    totalItems: total,
    currentPage: req.query.page ? parseInt(req.query.page) : 1,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize) : total,
    totalPages: req.query.pageSize ? Math.ceil(total / parseInt(req.query.pageSize)) : 1
  };
  return sendSuccess(res, 'Vehicles retrieved successfully', data, 200, meta);
};

const getVehicle = async (req, res) => {
  const vehicle = await service.getVehicleById(req.params.id);
  if (!vehicle) {
    return sendError(res, 'Vehicle not found', [], 404);
  }
  return sendSuccess(res, 'Vehicle details retrieved successfully', vehicle);
};

const createVehicle = async (req, res) => {
  const vehicle = await service.createVehicle(req.body);
  return sendSuccess(res, 'Vehicle created successfully', vehicle, 201);
};

const updateVehicle = async (req, res) => {
  const oldVehicle = await service.getVehicleById(req.params.id);
  if (!oldVehicle) {
    return sendError(res, 'Vehicle not found', [], 404);
  }

  const vehicle = await service.updateVehicle(req.params.id, req.body);
  return sendSuccess(res, 'Vehicle updated successfully', vehicle);
};

const deleteVehicle = async (req, res) => {
  const oldVehicle = await service.getVehicleById(req.params.id);
  if (!oldVehicle) {
    return sendError(res, 'Vehicle not found', [], 404);
  }

  await service.deleteVehicle(req.params.id);
  return sendSuccess(res, 'Vehicle deleted successfully');
};

const bulkImportVehicles = async (req, res) => {
  if (!req.body.vehicles || !Array.isArray(req.body.vehicles)) {
    return sendError(res, 'Vehicles array is required', [], 400);
  }
  const { successCount, errors } = await service.bulkImportVehicles(req.body.vehicles);
  return sendSuccess(res, `Successfully processed ${successCount} vehicles${errors.length ? `, ${errors.length} skipped` : ''}`, { successCount, errors }, 201);
};

module.exports = {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  bulkImportVehicles
};
