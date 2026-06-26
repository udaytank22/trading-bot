import { createResourceApi } from './factory';
import apiClient from '../apiClient';

const api = createResourceApi('/inventory');

export const getItems = api.getAll;
export const getItem = api.getById;
export const createItem = api.create;
export const updateItem = api.update;
export const deleteItem = api.remove;

export const logMovement = async (movementData) => {
  const response = await apiClient.post('/inventory/movements', movementData);
  return response.data;
};
