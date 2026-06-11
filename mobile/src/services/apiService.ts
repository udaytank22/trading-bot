export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  INQUIRIES: {
    BASE: '/inquiries',
    BY_ID: (id: string) => `/inquiries/${id}`,
    STOCK_CHECK: (id: string) => `/inquiries/${id}/stock-check`,
    SEND_RFQ: (id: string) => `/inquiries/${id}/send-rfq`,
    SUPPLIER_QUOTE: (id: string) => `/inquiries/${id}/supplier-quote`,
    CLIENT_QUOTE: (id: string) => `/inquiries/${id}/client-quote`,
    TEAM_LEAD_APPROVE: (id: string) => `/inquiries/${id}/team-lead-approve`,
    ADMIN_APPROVE: (id: string) => `/inquiries/${id}/admin-approve`,
    FINAL_VERIFY: (id: string) => `/inquiries/${id}/final-verify`,
    CLIENT_DECISION: (id: string) => `/inquiries/${id}/client-decision`,
    CONFIRM_DEAL: (id: string) => `/inquiries/${id}/confirm-deal`,
    CLOSE: (id: string) => `/inquiries/${id}/close`,
  },
  INVENTORY: {
    BASE: '/inventory',
    BY_ID: (id: string) => `/inventory/${id}`,
    MOVEMENTS: '/inventory/movements',
  },
  EMPLOYEES: {
    BASE: '/employees',
    BY_ID: (id: string) => `/employees/${id}`,
    ATTENDANCE: (id: string) => `/employees/${id}/attendance`,
  },
  PURCHASE_ORDERS: {
    BASE: '/purchase-orders',
    BY_ID: (id: string) => `/purchase-orders/${id}`,
    SEND_EMAIL: (id: string) => `/purchase-orders/${id}/send-email`,
  },
  INVOICES: {
    BASE: '/invoices',
    BY_ID: (id: string) => `/invoices/${id}`,
    SEND_EMAIL: (id: string) => `/invoices/${id}/send`,
  },
  BANK_ACCOUNTS: {
    BASE: '/bank-accounts',
    BY_ID: (id: string) => `/bank-accounts/${id}`,
  },
  CLIENTS: {
    BASE: '/clients',
  },
  SUPPLIERS: {
    BASE: '/suppliers',
  },
};
