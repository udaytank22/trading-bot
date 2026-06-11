import apiClient from '../apiClient';

export const getInvoices = async (params = {}) => {
  const response = await apiClient.get('/invoices', { params });
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

export const downloadPdf = async (id) => {
  const response = await apiClient.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
  return response.data;
};

export const previewInvoice = async (id) => {
  const response = await apiClient.get(`/invoices/${id}/preview`);
  return response.data;
};

export const deleteInvoice = async (id) => {
  const response = await apiClient.delete(`/invoices/${id}`);
  return response.data;
};

export const generateInvoiceFromShipment = async (shipmentId) => {
  const response = await apiClient.post(`/invoices/generate/shipment/${shipmentId}`);
  return response.data;
};

export const generateInvoiceFromInquiry = async (data) => {
  const response = await apiClient.post('/invoices/generate/inquiry', data);
  return response.data;
};

export const sendInvoiceEmail = async (id, data) => {
  const response = await apiClient.post(`/invoices/${id}/send`, data);
  return response.data;
};
