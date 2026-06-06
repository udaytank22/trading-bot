import apiClient from '../apiClient';

export const getShipments = async (params = {}) => {
  const response = await apiClient.get('/shipments', { params });
  return response.data;
};

export const getShipment = async (id) => {
  const response = await apiClient.get(`/shipments/${id}`);
  return response.data;
};

export const createShipment = async (data) => {
  const response = await apiClient.post('/shipments', data);
  return response.data;
};

export const updateShipment = async (id, data) => {
  const response = await apiClient.put(`/shipments/${id}`, data);
  return response.data;
};

export const deleteShipment = async (id) => {
  const response = await apiClient.delete(`/shipments/${id}`);
  return response.data;
};
