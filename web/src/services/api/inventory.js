import apiClient from '../apiClient';

export const getItems = async () => {
  const response = await apiClient.get('/inventory');
  return response.data;
};

export const getItem = async (id) => {
  const response = await apiClient.get(`/inventory/${id}`);
  return response.data;
};

export const createItem = async (data) => {
  const response = await apiClient.post('/inventory', data);
  return response.data;
};

export const updateItem = async (id, data) => {
  const response = await apiClient.put(`/inventory/${id}`, data);
  return response.data;
};

export const deleteItem = async (id) => {
  const response = await apiClient.delete(`/inventory/${id}`);
  return response.data;
};

export const logMovement = async (movementData) => {
  const response = await apiClient.post('/inventory/movements', movementData);
  return response.data;
};
