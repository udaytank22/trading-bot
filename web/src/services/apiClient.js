import axios from 'axios';
import { API_BASE_URL } from '../config/env';

const BASE_URL = API_BASE_URL;
const API_PREFIX = '/api';

/**
 * Shared Axios instance for all standard API requests.
 */
const apiClient = axios.create({
  baseURL: `${BASE_URL}${API_PREFIX}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  },
  withCredentials: true
});

// Flag to prevent infinite refresh loops
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach Auth Token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global Errors & Token Refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${BASE_URL}${API_PREFIX}/auth/refresh`, { refreshToken });
        const { token } = response.data;

        localStorage.setItem('token', token);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        originalRequest.headers['Authorization'] = `Bearer ${token}`;

        processQueue(null, token);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('token');
        
        if (!window.location.hash.includes('/login')) {
          window.location.hash = '#/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status >= 500) {
      console.error('API Error:', error.response?.data?.message || error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;

/**
 * Legacy compatibility wrappers for apiGet and apiPost.
 *
 * Audit Summary (Phase 5 Data Fetching Consistency):
 * - Call Sites in web/src: 0 active call sites remaining.
 * - Migration Status: All core feature modules (Inquiries, Invoices, Accounts, Clients, Suppliers,
 *   Employees, Inventory, Purchase Orders, Dashboard) have been fully migrated to use @tanstack/react-query
 *   hooks (src/hooks/queries/*) or modular resource services built on apiClient (src/services/api/*).
 * - Retained Usages & Legitimate Purpose: `apiGet` and `apiPost` are intentionally preserved strictly
 *   for non-standard API prefixes (`/webhook`, `/sheets`) and potential legacy Google Sheets integrations
 *   or external scripts that bypass the standard `/api` prefix.
 */
export async function apiGet(path) {
  // If the path starts with webhook or sheets, route directly to BASE_URL instead of /api
  const url = (path.startsWith('/webhook') || path.startsWith('/sheets'))
    ? `${BASE_URL}${path}`
    : path;

  // Use apiClient if standard, otherwise use direct axios get
  if (path.startsWith('/webhook') || path.startsWith('/sheets')) {
    const res = await axios.get(url);
    return res.data;
  }

  const response = await apiClient.get(path);
  return response.data;
}

export async function apiPost(path, body) {
  const url = (path.startsWith('/webhook') || path.startsWith('/sheets'))
    ? `${BASE_URL}${path}`
    : path;

  if (path.startsWith('/webhook') || path.startsWith('/sheets')) {
    const res = await axios.post(url, body);
    return res.data;
  }

  const response = await apiClient.post(path, body);
  return response.data;
}
