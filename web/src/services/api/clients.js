import { createResourceApi } from './factory';
import apiClient from '../apiClient';

const api = createResourceApi('/clients');

export const getClients = api.getAll;
export const getClient = api.getById;
export const createClient = api.create;
export const updateClient = api.update;
export const deleteClient = api.remove;

export const bulkImportClients = async (clients) => {
  const response = await apiClient.post('/clients/bulk', { clients });
  return response.data;
};
