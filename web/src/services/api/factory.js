import apiClient from '../apiClient';

export const createResourceApi = (resourcePath) => {
  return {
    getAll: async (params = {}) => {
      const response = await apiClient.get(resourcePath, { params });
      return response.data;
    },
    getById: async (id) => {
      const response = await apiClient.get(`${resourcePath}/${id}`);
      return response.data;
    },
    create: async (data) => {
      const response = await apiClient.post(resourcePath, data);
      return response.data;
    },
    update: async (id, data) => {
      const response = await apiClient.put(`${resourcePath}/${id}`, data);
      return response.data;
    },
    remove: async (id) => {
      const response = await apiClient.delete(`${resourcePath}/${id}`);
      return response.data;
    }
  };
};
