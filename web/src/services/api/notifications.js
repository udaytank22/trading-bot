import { createResourceApi } from './factory';
import apiClient from '../apiClient';

const api = createResourceApi('/notifications');

export const getNotifications = api.getAll;
export const deleteNotification = api.remove;

export const markAllRead = async () => {
  const response = await apiClient.put('/notifications/mark-all-read');
  return response.data;
};

export const markRead = async (id) => {
  const response = await apiClient.put(`/notifications/${id}/mark-read`);
  return response.data;
};
