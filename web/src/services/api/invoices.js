import apiClient from '../apiClient';

export const getInvoices = async () => {
  const response = await apiClient.get('/invoices');
  return response.data;
};

export const getInvoice = async (id) => {
  const response = await apiClient.get(`/invoices/${id}`);
  return response.data;
};

export const createInvoice = async (data) => {
  const response = await apiClient.post('/invoices', data);
  return response.data;
};

export const updateInvoice = async (id, data) => {
  const response = await apiClient.put(`/invoices/${id}`, data);
  return response.data;
};

export const deleteInvoice = async (id) => {
  const response = await apiClient.delete(`/invoices/${id}`);
  return response.data;
};
