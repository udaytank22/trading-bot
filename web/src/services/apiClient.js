// src/services/apiClient.js
import axios from 'axios';
import Swal from 'sweetalert2';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export { USE_MOCK };

// Centralized Axios instance pointing to the API root
const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach access token
apiClient.interceptors.request.use(
  (config) => {
    // Bypass token check for login and refresh endpoints
    if (config.url && (config.url.includes('/auth/login') || config.url.includes('/auth/refresh'))) {
      return config;
    }

    const token = sessionStorage.getItem('token');
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
    // Show success toast on mutations (POST, PUT, PATCH, DELETE)
    const method = response.config?.method?.toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      const isDark = document.documentElement.classList.contains('dark');
      let title = 'Success';
      let text = response.data?.message || 'Operation completed successfully';
      
      if (method === 'post') title = 'Entry Created Successfully';
      else if (method === 'put' || method === 'patch') title = 'Entry Updated Successfully';
      else if (method === 'delete') title = 'Entry Deleted Successfully';

      Swal.fire({
        icon: 'success',
        title: title,
        text: text,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: isDark ? '#1a1d23' : '#ffffff',
        color: isDark ? '#ffffff' : '#111827',
        iconColor: '#10B981',
        customClass: {
          popup: 'border border-gray-200 dark:border-[#2a2d33] rounded-xl shadow-lg font-sans',
        }
      });
    }
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

      const refreshToken = sessionStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        // No refresh token, trigger logout or auth error
        return Promise.reject(error);
      }

      try {
        // Request token refresh using base axios to avoid client request interception
        const response = await axios.post(`${BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });

        if (response.data && response.data.success) {
          const newToken = response.data.data.accessToken || response.data.data.token;
          const newRefreshToken = response.data.data.refreshToken;

          sessionStorage.setItem('token', newToken);
          if (newRefreshToken) {
            sessionStorage.setItem('refreshToken', newRefreshToken);
          }

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
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('refreshToken');
        window.dispatchEvent(new CustomEvent('auth-logout'));
        return Promise.reject(refreshError);
      }
    }

    // Only show error alert if it's not a first 401 (which is handled by silent token refresh above)
    const isFirst401 = error.response && error.response.status === 401 && !originalRequest?._retry && !originalRequest?.url?.includes('/auth/login') && !originalRequest?.url?.includes('/auth/refresh');
    
    if (!isFirst401) {
      const isDark = document.documentElement.classList.contains('dark');
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'An unexpected error occurred';
      
      Swal.fire({
        icon: 'error',
        title: 'Error Occurred',
        text: errorMessage,
        background: isDark ? '#1a1d23' : '#ffffff',
        color: isDark ? '#ffffff' : '#111827',
        confirmButtonColor: '#3B82F6',
        customClass: {
          popup: 'bg-white dark:bg-[#1a1d23] text-gray-900 dark:text-white rounded-2xl border border-gray-200 dark:border-[#2a2d33] shadow-2xl font-sans',
          title: 'text-xl font-bold text-gray-900 dark:text-white',
          htmlContainer: 'text-gray-500 dark:text-gray-400 font-medium',
          confirmButton: 'px-6 py-2.5 rounded-xl font-bold transition-all border-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#1a1d23] bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 focus:ring-blue-500',
        },
        buttonsStyling: false
      });
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
