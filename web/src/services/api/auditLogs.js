import apiClient from '../apiClient';

export const getAuditLogs = async (params = {}) => {
  const response = await apiClient.get('/audit-logs', { params });
  return response.data;
};
