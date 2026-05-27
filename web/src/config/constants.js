// src/config/constants.js

/** Inquiry/Deal status values — single source of truth */
export const INQUIRY_STATUS = {
  PENDING       : 'PENDING',
  RFQ_SENT      : 'RFQ_SENT',
  RFQ_RECEIVED  : 'RFQ_RECEIVED',
  QUOTE_SENT    : 'QUOTE_SENT',
  CONFIRMED     : 'CONFIRMED',
  CANCELLED     : 'CANCELLED',
};

/** User roles */
export const USER_ROLE = {
  ADMIN    : 'admin',
  EMPLOYEE : 'employee',
};

/** Nav tabs visible to each role */
export const EMPLOYEE_TABS = [
  'Dashboard', 'Inquiries', 'Purchase Orders',
  'Supply', 'Documents', 'Profile', 'Notifications', 'To-Do',
];

/** Local storage keys */
export const STORAGE_KEYS = {
  IS_AUTH      : 'is_auth',
  USER_PROFILE : 'user_profile',
  THEME        : 'theme',
};

/** Theme values */
export const THEME = {
  DARK  : 'dark',
  LIGHT : 'light',
};

/** Pagination */
export const DEFAULT_PAGE_SIZE = 10;
