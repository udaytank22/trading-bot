import { createResourceApi } from './factory';
import apiClient from '../apiClient';

const api = createResourceApi('/invoices');

export const getInvoices = api.getAll;
export const getInvoice = api.getById;
export const createInvoice = api.create;
export const updateInvoice = api.update;
export const deleteInvoice = api.remove;

export const downloadPdf = async (id) => {
  const response = await apiClient.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
  return response.data;
};

export const previewInvoice = async (id) => {
  const response = await apiClient.get(`/invoices/${id}/preview`);
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
