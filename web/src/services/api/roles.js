import apiClient from '../apiClient';

export const getRoles = async () => {
  const response = await apiClient.get('/roles');
  return response.data;
};

export const getRole = async (id) => {
  const response = await apiClient.get(`/roles/${id}`);
  return response.data;
};

export const createRole = async (data) => {
  const response = await apiClient.post('/roles', data);
  return response.data;
};

export const updateRole = async (id, data) => {
  const response = await apiClient.put(`/roles/${id}`, data);
  return response.data;
};

export const deleteRole = async (id) => {
  const response = await apiClient.delete(`/roles/${id}`);
  return response.data;
};
