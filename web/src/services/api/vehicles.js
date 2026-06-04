import apiClient from '../apiClient';

export const getVehicles = async (params = {}) => {
  const response = await apiClient.get('/vehicles', { params });
  return response.data;
};

export const getVehicle = async (id) => {
  const response = await apiClient.get(`/vehicles/${id}`);
  return response.data;
};

export const createVehicle = async (data) => {
  const response = await apiClient.post('/vehicles', data);
  return response.data;
};

export const updateVehicle = async (id, data) => {
  const response = await apiClient.put(`/vehicles/${id}`, data);
  return response.data;
};

export const deleteVehicle = async (id) => {
  const response = await apiClient.delete(`/vehicles/${id}`);
  return response.data;
};
