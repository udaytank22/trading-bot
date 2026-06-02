import apiClient from '../apiClient';

export const getDocuments = async () => {
  const response = await apiClient.get('/documents');
  return response.data;
};

export const getDocument = async (id) => {
  const response = await apiClient.get(`/documents/${id}`);
  return response.data;
};

export const createDocument = async (data) => {
  const response = await apiClient.post('/documents', data);
  return response.data;
};

export const updateDocument = async (id, data) => {
  const response = await apiClient.put(`/documents/${id}`, data);
  return response.data;
};

export const deleteDocument = async (id) => {
  const response = await apiClient.delete(`/documents/${id}`);
  return response.data;
};
