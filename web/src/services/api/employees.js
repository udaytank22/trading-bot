import apiClient from '../apiClient';

export const getEmployees = async (params = {}) => {
  const response = await apiClient.get('/employees', { params });
  return response.data;
};

export const getEmployee = async (id) => {
  const response = await apiClient.get(`/employees/${id}`);
  return response.data;
};

export const createEmployee = async (data) => {
  const response = await apiClient.post('/employees', data);
  return response.data;
};

export const updateEmployee = async (id, data) => {
  const response = await apiClient.put(`/employees/${id}`, data);
  return response.data;
};

export const deleteEmployee = async (id) => {
  const response = await apiClient.delete(`/employees/${id}`);
  return response.data;
};

export const logAttendance = async (id, attendanceData) => {
  const response = await apiClient.post(`/employees/${id}/attendance`, attendanceData);
  return response.data;
};
