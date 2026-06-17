// src/api/reports.js
import apiClient from '../services/apiClient';

export const getDashboardStats = async () => {
  const response = await apiClient.get('/reports/dashboard');
  return response.data;
};

export const getPipelineReport = async () => {
  const response = await apiClient.get('/reports/pipeline');
  return response.data;
};

export const getProfitReport = async (filters) => {
  const response = await apiClient.get('/reports/profit', { params: filters });
  return response.data;
};

export const getInvoiceReport = async (filters) => {
  const response = await apiClient.get('/reports/invoices', { params: filters });
  return response.data;
};

export const getPaymentReport = async (filters) => {
  const response = await apiClient.get('/reports/payments', { params: filters });
  return response.data;
};

export const getInventoryReport = async () => {
  const response = await apiClient.get('/reports/inventory');
  return response.data;
};

export const getEmployeeReport = async () => {
  const response = await apiClient.get('/reports/employees');
  return response.data;
};

export const getDocumentExpiryReport = async () => {
  const response = await apiClient.get('/reports/documents');
  return response.data;
};
