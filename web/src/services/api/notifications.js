import apiClient from '../apiClient';

export const getNotifications = async () => {
  const response = await apiClient.get('/notifications');
  return response.data;
};

export const markAllRead = async () => {
  const response = await apiClient.put('/notifications/mark-all-read');
  return response.data;
};

export const markRead = async (id) => {
  const response = await apiClient.put(`/notifications/${id}/mark-read`);
  return response.data;
};

export const deleteNotification = async (id) => {
  const response = await apiClient.delete(`/notifications/${id}`);
  return response.data;
};
