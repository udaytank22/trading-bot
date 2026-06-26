import { createResourceApi } from './factory';
import apiClient from '../apiClient';

const api = createResourceApi('/products');

export const getProducts = api.getAll;
export const getProduct = api.getById;
export const createProduct = api.create;
export const updateProduct = api.update;
export const deleteProduct = api.remove;

export const bulkUpsert = async (productsData) => {
  const response = await apiClient.post('/products/bulk', { products: productsData });
  return response.data;
};
