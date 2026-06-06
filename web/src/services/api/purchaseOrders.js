import apiClient from '../apiClient';

export const getPurchaseOrders = async (params = {}) => {
  const response = await apiClient.get('/purchase-orders', { params });
  return response.data;
};

export const getPurchaseOrder = async (id) => {
  const response = await apiClient.get(`/purchase-orders/${id}`);
  return response.data;
};

export const createPurchaseOrder = async (data) => {
  const response = await apiClient.post('/purchase-orders', data);
  return response.data;
};

export const updatePurchaseOrder = async (id, data) => {
  const response = await apiClient.put(`/purchase-orders/${id}`, data);
  return response.data;
};

export const deletePurchaseOrder = async (id) => {
  const response = await apiClient.delete(`/purchase-orders/${id}`);
  return response.data;
};

export const sendPurchaseOrderEmail = async (id) => {
  const response = await apiClient.post(`/purchase-orders/${id}/send-email`);
  return response.data;
};
