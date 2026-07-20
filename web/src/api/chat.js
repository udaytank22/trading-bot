import axios from 'axios';
import { API_BASE_URL } from '../config/env';

const API_URL = API_BASE_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const getChatUsers = async () => {
  const response = await axios.get(`${API_URL}/api/chat/users`, {
    headers: getAuthHeaders()
  });
  return response.data.data;
};

export const getChatMessages = async (userId) => {
  const response = await axios.get(`${API_URL}/api/chat/messages/${userId}`, {
    headers: getAuthHeaders()
  });
  return response.data.data;
};
