import apiClient from '../apiClient';

export const login = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data;
};

export const refresh = async (refreshToken) => {
  const response = await apiClient.post('/auth/refresh', { refreshToken });
  return response.data;
};

export const logout = async () => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};

export const getMe = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

export const changePassword = async (oldPassword, newPassword) => {
  const response = await apiClient.post('/auth/change-password', { oldPassword, newPassword });
  return response.data;
};
