import { apiClient } from '../utils/apiClient';

export const authService = {
  login: (data: any) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  me: () => apiClient.get('/auth/me'),
  changePassword: (data: any) => apiClient.post('/auth/change-password', data),
};

export const inquiriesService = {
  getInquiries: () => apiClient.get('/inquiries'),
  getInquiry: (id: string) => apiClient.get(`/inquiries/${id}`),
  createInquiry: (data: any) => apiClient.post('/inquiries', data),
  updateInquiry: (id: string, data: any) => apiClient.put(`/inquiries/${id}`, data),
  deleteInquiry: (id: string) => apiClient.delete(`/inquiries/${id}`),
  
  // Specific stage actions
  stockCheck: (id: string, data: any) => apiClient.post(`/inquiries/${id}/stock-check`, data),
  sendRFQ: (id: string) => apiClient.post(`/inquiries/${id}/send-rfq`),
  supplierQuote: (id: string, data: any) => apiClient.post(`/inquiries/${id}/supplier-quote`, data),
  clientQuote: (id: string, data: any) => apiClient.post(`/inquiries/${id}/client-quote`, data),
  teamLeadApprove: (id: string, data: any) => apiClient.post(`/inquiries/${id}/team-lead-approve`, data),
  adminApprove: (id: string, data: any) => apiClient.post(`/inquiries/${id}/admin-approve`, data),
  finalVerify: (id: string) => apiClient.post(`/inquiries/${id}/final-verify`),
  clientDecision: (id: string, data: any) => apiClient.post(`/inquiries/${id}/client-decision`, data),
  confirmDeal: (id: string) => apiClient.post(`/inquiries/${id}/confirm-deal`),
  closeInquiry: (id: string) => apiClient.post(`/inquiries/${id}/close`),
};

export const inventoryService = {
  getItems: () => apiClient.get('/inventory'),
  getItem: (id: string) => apiClient.get(`/inventory/${id}`),
  createItem: (data: any) => apiClient.post('/inventory', data),
  updateItem: (id: string, data: any) => apiClient.put(`/inventory/${id}`, data),
  deleteItem: (id: string) => apiClient.delete(`/inventory/${id}`),
  moveStock: (data: any) => apiClient.post('/inventory/movements', data),
};

export const employeesService = {
  getEmployees: () => apiClient.get('/employees'),
  getEmployee: (id: string) => apiClient.get(`/employees/${id}`),
  createEmployee: (data: any) => apiClient.post('/employees', data),
  updateEmployee: (id: string, data: any) => apiClient.put(`/employees/${id}`, data),
  deleteEmployee: (id: string) => apiClient.delete(`/employees/${id}`),
  logAttendance: (id: string, data: any) => apiClient.post(`/employees/${id}/attendance`, data),
};

export const purchaseOrdersService = {
  getPOs: () => apiClient.get('/purchase-orders'),
  getPO: (id: string) => apiClient.get(`/purchase-orders/${id}`),
  createPO: (data: any) => apiClient.post('/purchase-orders', data),
  updatePO: (id: string, data: any) => apiClient.put(`/purchase-orders/${id}`, data),
  deletePO: (id: string) => apiClient.delete(`/purchase-orders/${id}`),
  sendEmail: (id: string) => apiClient.post(`/purchase-orders/${id}/send-email`),
};

export const invoicesService = {
  getInvoices: () => apiClient.get('/invoices'),
  getInvoice: (id: string) => apiClient.get(`/invoices/${id}`),
  createInvoice: (data: any) => apiClient.post('/invoices', data),
  updateInvoice: (id: string, data: any) => apiClient.put(`/invoices/${id}`, data),
  deleteInvoice: (id: string) => apiClient.delete(`/invoices/${id}`),
  sendInvoiceEmail: (id: string) => apiClient.post(`/invoices/${id}/send`),
};

export const bankAccountsService = {
  getBankAccounts: () => apiClient.get('/bank-accounts'),
  getBankAccount: (id: string) => apiClient.get(`/bank-accounts/${id}`),
  createBankAccount: (data: any) => apiClient.post('/bank-accounts', data),
  updateBankAccount: (id: string, data: any) => apiClient.put(`/bank-accounts/${id}`, data),
  deleteBankAccount: (id: string) => apiClient.delete(`/bank-accounts/${id}`),
};

export const clientsService = {
  getClients: () => apiClient.get('/clients'),
};

export const suppliersService = {
  getSuppliers: () => apiClient.get('/suppliers'),
};
