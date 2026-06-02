import apiClient from '../apiClient';

export const getPayments = async () => {
  const response = await apiClient.get('/payments');
  return response.data;
};

export const getPayment = async (id) => {
  const response = await apiClient.get(`/payments/${id}`);
  return response.data;
};

export const createPayment = async (data) => {
  const response = await apiClient.post('/payments', data);
  return response.data;
};

export const deletePayment = async (id) => {
  const response = await apiClient.delete(`/payments/${id}`);
  return response.data;
};
