import apiClient from '../services/apiClient';

export const fetchInventory = async () => {
  const response = await apiClient.get('/inventory');
  return response.data;
};

export const getInventoryItem = async (id) => {
  const response = await apiClient.get(`/inventory/${id}`);
  return response.data;
};

export const createInventoryItem = async (data) => {
  const response = await apiClient.post('/inventory', data);
  return response.data;
};

export const updateInventoryItem = async (id, data) => {
  const response = await apiClient.put(`/inventory/${id}`, data);
  return response.data;
};

export const deleteInventoryItem = async (id) => {
  const response = await apiClient.delete(`/inventory/${id}`);
  return response.data;
};

export const moveStock = async (data) => {
  const response = await apiClient.post('/inventory/movements', data);
  return response.data;
};
