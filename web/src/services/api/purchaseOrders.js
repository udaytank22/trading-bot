import { createResourceApi } from './factory';
import apiClient from '../apiClient';

const api = createResourceApi('/purchase-orders');

export const getPurchaseOrders = api.getAll;
export const getPurchaseOrder = api.getById;
export const createPurchaseOrder = api.create;
export const updatePurchaseOrder = api.update;
export const deletePurchaseOrder = api.remove;

export const sendPurchaseOrderEmail = async (id) => {
  const response = await apiClient.post(`/purchase-orders/${id}/send-email`);
  return response.data;
};
