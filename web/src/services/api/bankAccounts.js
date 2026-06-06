import apiClient from '../apiClient';

export const getBankAccounts = async (params = {}) => {
  const response = await apiClient.get('/bank-accounts', { params });
  return response.data;
};

export const getBankAccount = async (id) => {
  const response = await apiClient.get(`/bank-accounts/${id}`);
  return response.data;
};

export const createBankAccount = async (data) => {
  const response = await apiClient.post('/bank-accounts', data);
  return response.data;
};

export const updateBankAccount = async (id, data) => {
  const response = await apiClient.put(`/bank-accounts/${id}`, data);
  return response.data;
};

export const deleteBankAccount = async (id) => {
  const response = await apiClient.delete(`/bank-accounts/${id}`);
  return response.data;
};
