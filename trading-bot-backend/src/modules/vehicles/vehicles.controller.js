const service = require('./vehicles.service');
const { sendSuccess, sendError } = require('../../utils/response');

const getVehicles = async (req, res) => {
  const vehicles = await service.getAllVehicles();
  return sendSuccess(res, 'Vehicles retrieved successfully', vehicles);
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

module.exports = {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle
};
