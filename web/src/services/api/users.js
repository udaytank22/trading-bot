import apiClient from '../apiClient';

export const getUsers = async (params = {}) => {
  const response = await apiClient.get('/users', { params });
  return response.data;
};

export const getUser = async (id) => {
  const response = await apiClient.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (data) => {
  const response = await apiClient.post('/users', data);
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await apiClient.put(`/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await apiClient.delete(`/users/${id}`);
  return response.data;
};
