import apiClient from '../apiClient';

const normalizeInquiry = (inq) => {
  if (!inq) return null;
  return {
    ...inq,
    inquiry_id: inq.inquiryNumber || inq.id,
    buyer_name: inq.client ? inq.client.name : (inq.buyer_name || 'N/A'),
    buyer_email: inq.client ? inq.client.email : (inq.buyer_email || 'N/A'),
    status: inq.currentStatus || inq.status,
    products: inq.items ? inq.items.map(item => ({
      product_name: item.product?.name || item.description || 'Unknown Product',
      quantity: item.quantity,
      unit: item.unit || 'MT',
      specs: item.specs || ''
    })) : []
  };
};

export const getDashboardStats = async () => {
  const response = await apiClient.get('/reports/dashboard');
  if (response.data && response.data.success && response.data.data) {
    const stats = response.data.data;
    if (Array.isArray(stats.recentInquiries)) {
      stats.recentInquiries = stats.recentInquiries.map(normalizeInquiry);
    }
  }
  return response.data;
};

export const getPipelineReport = async () => {
  const response = await apiClient.get('/reports/pipeline');
  return response.data;
};

export const getProfitReport = async (startDate, endDate) => {
  const response = await apiClient.get('/reports/profit', {
    params: { startDate, endDate },
  });
  return response.data;
};

export const getInvoiceReport = async (startDate, endDate) => {
  const response = await apiClient.get('/reports/invoices', {
    params: { startDate, endDate },
  });
  return response.data;
};

export const getPaymentReport = async (startDate, endDate) => {
  const response = await apiClient.get('/reports/payments', {
    params: { startDate, endDate },
  });
  return response.data;
};

export const getInventoryReport = async () => {
  const response = await apiClient.get('/reports/inventory');
  return response.data;
};

export const getEmployeeReport = async () => {
  const response = await apiClient.get('/reports/employees');
  return response.data;
};

export const getDocumentExpiryReport = async () => {
  const response = await apiClient.get('/reports/documents');
  return response.data;
};
