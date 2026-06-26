// src/services/apiClient.js
import axios from 'axios';
import Swal from 'sweetalert2';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').trim();
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export { USE_MOCK };

// Centralized Axios instance pointing to the API root
const apiClient = axios.create({
  baseURL: `${BASE_URL.trim()}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// Request Interceptor: Attach access token
apiClient.interceptors.request.use(
  (config) => {
    // Bypass token check for login and refresh endpoints
    if (config.url && (config.url.includes('/auth/login') || config.url.includes('/auth/refresh'))) {
      return config;
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // No token – trigger logout flow
      window.dispatchEvent(new CustomEvent('auth-logout'));
      return Promise.reject(new Error('Authentication token missing'));
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle token refresh on 401 Unauthorized
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Skip token refresh if the request failed was the login/refresh endpoint
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Request token refresh using base axios with credentials
        const response = await axios.post(`${BASE_URL}/api/auth/refresh`, {}, {
          withCredentials: true
        });

        if (response.data && response.data.success) {
          const newToken = response.data.data.accessToken || response.data.data.token;

          localStorage.setItem('token', newToken);

          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          processQueue(null, newToken);
          isRefreshing = false;

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        // Refresh token invalid or expired: clear tokens and logout
        localStorage.removeItem('token');
        window.dispatchEvent(new CustomEvent('auth-logout'));
        return Promise.reject(refreshError);
      }
    }

    // Only show error alert if it's not a first 401 (which is handled by silent token refresh above)
    const isFirst401 = error.response && error.response.status === 401 && !originalRequest?._retry && !originalRequest?.url?.includes('/auth/login') && !originalRequest?.url?.includes('/auth/refresh');
    const isLoginRequest = originalRequest?.url?.includes('/auth/login');

    if (!isFirst401 && !isLoginRequest) {
      // Components handle their own errors and show specific toasts.
      // We removed the global Swal.fire to prevent overriding specific component error toasts.
      console.error('API Error:', error.response?.data?.message || error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// Compatibility wrappers for older sheetsService and mock operations
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
