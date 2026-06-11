import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import { API_ENDPOINTS } from './apiService';
import axiosRetry from 'axios-retry';
import { Platform } from 'react-native';

let apiBaseUrl = Config.API_BASEURL;
if (Platform.OS === 'android' && apiBaseUrl?.includes('localhost')) {
    apiBaseUrl = apiBaseUrl.replace('localhost', '10.0.2.2');
}

const PUBLIC_API_ROUTES = [API_ENDPOINTS.AUTH.LOGIN];
const apiClient = axios.create({
    baseURL: apiBaseUrl, // API base URL from environment config
    timeout: 5000 * 10,
    headers: {
        Accept: 'application/json',
    },
});

axiosRetry(apiClient, {
    retries: 3, // Retry count
    retryDelay: retryCount => {
        return axiosRetry.exponentialDelay(retryCount); // Delay: 1s, 2s, 4s...
    },
    retryCondition: error => {
        // const status = error?.response?.status;

        // Retry on network errors or these HTTP status codes
        return axiosRetry.isNetworkError(error);
    },
    shouldResetTimeout: true, // Recommended for long-running requests
});

// Request interceptor to add the auth token (if required)
apiClient.interceptors.request.use(
    async config => {
        if (config.data instanceof FormData) {
            config.headers['Content-Type'] = 'multipart/form-data';
        }

        if (config.url && PUBLIC_API_ROUTES.includes(config.url)) {
            return config;
        } else {
            // Get the auth token from AsyncStorage
            const token = await AsyncStorage.getItem('authToken');
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return config;
    },
    error => {
        console.error('Request Error:', error);
        return Promise.reject(new Error(error));
    },
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// Response interceptor for error handling
apiClient.interceptors.response.use(
    response => {
        console.log(response, 'response');
        // Return the successful response
        return response;
    },
    error => {
        const originalRequest = error.config;
        
        if (error.response) {
            // Server responded with a status other than 2xx
            const { status, data } = error.response;

            if (status === 401 && !originalRequest._retry) {
                if (isRefreshing) {
                    return new Promise(function(resolve, reject) {
                        failedQueue.push({ resolve, reject });
                    }).then(token => {
                        originalRequest.headers['Authorization'] = 'Bearer ' + token;
                        return apiClient(originalRequest);
                    }).catch(err => {
                        return Promise.reject(err);
                    });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                return new Promise(async (resolve, reject) => {
                    try {
                        const refreshToken = await AsyncStorage.getItem('refreshToken');
                        if (!refreshToken) {
                            throw new Error('No refresh token available');
                        }
                        
                        // Using a standard axios request to avoid looping with interceptors
                        const response = await axios.post(`${apiBaseUrl}/auth/refresh`, { refreshToken });
                        
                        // Backend usually returns { success: true, data: { accessToken, refreshToken } }
                        // Or if directly in data: { accessToken, refreshToken }
                        const newAccessToken = response.data.data ? response.data.data.accessToken : response.data.accessToken;
                        const newRefreshToken = response.data.data ? response.data.data.refreshToken : response.data.refreshToken;
                        
                        if (newAccessToken) {
                            await saveAuthToken(newAccessToken);
                        }
                        if (newRefreshToken) {
                            await AsyncStorage.setItem('refreshToken', newRefreshToken);
                        }
                        
                        apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
                        originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
                        
                        processQueue(null, newAccessToken);
                        resolve(apiClient(originalRequest));
                    } catch (err) {
                        processQueue(err, null);
                        console.error('Refresh token failed:', err);
                        await AsyncStorage.removeItem('authToken');
                        await AsyncStorage.removeItem('refreshToken');
                        reject(error); // Reject with original 401 error
                    } finally {
                        isRefreshing = false;
                    }
                });
            }

            switch (status) {
                case 400:
                    console.error('Bad Request:', data.message || 'Invalid request.');
                    break;
                case 401:
                    console.error(
                        'Unauthorized: Token is invalid or expired. Redirecting to login.',
                    );
                    AsyncStorage.removeItem('authToken');
                    AsyncStorage.removeItem('refreshToken');
                    // Add logic to navigate to the login screen if needed
                    break;
                case 403:
                    console.error(
                        'Forbidden: You do not have permission to access this resource.',
                    );
                    break;
                case 404:
                    console.error(
                        'Not Found:',
                        data.message || 'The requested resource does not exist.',
                    );
                    break;
                case 422:
                    console.error('Validation Error:', data.errors || 'Invalid input.');
                    break;
                case 500:
                    console.error('Server Error: Something went wrong on the server.');
                    break;
                default:
                    console.error(
                        `Unexpected Error [${status}]:`,
                        data.message || 'An unknown error occurred.',
                    );
            }
        } else if (error.request) {
            // No response received
            console.error(
                'Network Error: No response from server. Check your connection.',
            );
        } else {
            // Other errors
            console.error('Error:', error.message);
        }

        return Promise.reject(new Error(error.message || 'Unknown error occurred'));
    },
);

// Generalized API methods
export const apiGet = async (url: string, params = {}) => {
    try {
        console.log(`GET Request to: ${apiClient.defaults.baseURL}${url}`);
        const response = await apiClient.get(url, { params });
        return response.data;
    } catch (error) {
        console.error(`POST ${url} failed:`, error);
        throw error;
    }
};

export const apiPost = async (url: string, data = {}) => {
    try {
        const response = await apiClient.post(url, data);
        return response.data;
    } catch (error) {
        console.error(`POST ${url} failed:`, error);
        throw error;
    }
};

export const apiPut = async (url: string, data = {}) => {
    try {
        const response = await apiClient.put(url, data);
        return response.data;
    } catch (error) {
        console.error(`POST ${url} failed:`, error);
        throw error;
    }
};

export const apiDelete = async (url: string) => {
    try {
        const response = await apiClient.delete(url);
        return response.data;
    } catch (error) {
        console.error(`POST ${url} failed:`, error);
        throw error;
    }
};

// Helper methods for token management
export const saveAuthToken = async (token: string) => {
    try {
        await AsyncStorage.setItem('authToken', token);
    } catch (error) {
        console.error('Error saving auth token:', error);
    }
};

export const clearAuthToken = async () => {
    try {
        await AsyncStorage.removeItem('authToken');
    } catch (error) {
        console.error('Error clearing auth token:', error);
    }
};

export default apiClient;