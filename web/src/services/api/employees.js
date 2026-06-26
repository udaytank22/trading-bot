import { createResourceApi } from './factory';
import apiClient from '../apiClient';

const api = createResourceApi('/employees');

export const getEmployees = api.getAll;
export const getEmployee = api.getById;
export const createEmployee = api.create;
export const updateEmployee = api.update;
export const deleteEmployee = api.remove;

export const logAttendance = async (id, attendanceData) => {
  const response = await apiClient.post(`/employees/${id}/attendance`, attendanceData);
  return response.data;
};
