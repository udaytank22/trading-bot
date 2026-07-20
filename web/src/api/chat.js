import axios from 'axios';
import { API_BASE_URL } from '../config/env';
import { getAccessToken } from '../services/tokenStore';

const API_URL = API_BASE_URL;

const getAuthHeaders = () => {
  const token = getAccessToken();
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
