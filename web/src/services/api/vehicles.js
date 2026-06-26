import { createResourceApi } from './factory';
import apiClient from '../apiClient';

const api = createResourceApi('/vehicles');

export const getVehicles = api.getAll;
export const getVehicle = api.getById;
export const createVehicle = api.create;
export const updateVehicle = api.update;
export const deleteVehicle = api.remove;

export const bulkImport = async (vehiclesData) => {
  const response = await apiClient.post('/vehicles/bulk', { vehicles: vehiclesData });
  return response.data;
};
