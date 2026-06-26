import { createResourceApi } from './factory';
import apiClient from '../apiClient';

const api = createResourceApi('/suppliers');

export const getSuppliers = api.getAll;
export const getSupplier = api.getById;
export const createSupplier = api.create;
export const updateSupplier = api.update;
export const deleteSupplier = api.remove;

export const bulkImportSuppliers = async (suppliers) => {
  const response = await apiClient.post('/suppliers/bulk', { suppliers });
  return response.data;
};
