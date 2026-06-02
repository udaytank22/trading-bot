import apiClient from '../apiClient';

export const getQuotations = async () => {
  const response = await apiClient.get('/quotations');
  return response.data;
};

export const getQuotation = async (id) => {
  const response = await apiClient.get(`/quotations/${id}`);
  return response.data;
};
