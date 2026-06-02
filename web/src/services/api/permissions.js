import apiClient from '../apiClient';

export const getPermissions = async () => {
  const response = await apiClient.get('/permissions');
  return response.data;
};
