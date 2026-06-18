import apiClient from '../services/apiClient';

export const fetchInventory = async () => {
  const response = await apiClient.get('/inventory');
  return response.data;
};

export const getInventoryItem = async (id) => {
  const response = await apiClient.get(`/inventory/${id}`);
  return response.data;
};

export const createInventoryItem = async (data) => {
  const response = await apiClient.post('/inventory', data);
  return response.data;
};

export const updateInventoryItem = async (id, data) => {
  const response = await apiClient.put(`/inventory/${id}`, data);
  return response.data;
};

export const deleteInventoryItem = async (id) => {
  const response = await apiClient.delete(`/inventory/${id}`);
  return response.data;
};

export const moveStock = async (data) => {
  const response = await apiClient.post('/inventory/movements', data);
  return response.data;
};

/**
 * Check if all requested items are available in inventory
 * @param {Array<{description: string, quantity: number}>} items
 */
export const checkInventoryAvailability = async (items) => {
  const response = await apiClient.post('/inventory/check-availability', { items });
  return response.data;
};

/**
 * Get paginated inventory transaction history
 * @param {Object} params - { page, pageSize, type, itemName, startDate, endDate, referenceNumber }
 */
export const getInventoryTransactionHistory = async (params = {}) => {
  const response = await apiClient.get('/inventory/transactions', { params });
  return response.data;
};

/**
 * Mark inventory as dispatched for an inquiry
 * @param {number} inquiryId
 * @param {string} inquiryNumber
 */
export const dispatchInventoryForInquiry = async (inquiryId, inquiryNumber) => {
  const response = await apiClient.post(`/inventory/dispatch-inquiry/${inquiryId}`, { inquiryNumber });
  return response.data;
};
