import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('token');
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
