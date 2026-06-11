import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import { API_ENDPOINTS } from './apiService';
import axiosRetry from 'axios-retry';

const PUBLIC_API_ROUTES = [API_ENDPOINTS.AUTH.LOGIN];
const apiClient = axios.create({
    baseURL: Config.API_BASEURL, // API base URL from environment config
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

// Response interceptor for error handling
apiClient.interceptors.response.use(
    response => {
        // Return the successful response
        return response;
    },
    error => {
        if (error.response) {
            // Server responded with a status other than 2xx
            const { status, data } = error.response;

            switch (status) {
                case 400:
                    console.error('Bad Request:', data.message || 'Invalid request.');
                    break;
                case 401:
                    console.error(
                        'Unauthorized: Token is invalid or expired. Redirecting to login.',
                    );
                    AsyncStorage.removeItem('authToken');
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
        const response = await apiClient.get(url, { params });
        return response.data;
    } catch (error) {
        console.error(`POST ${url} failed:`, error);
        throw error;
    }
};

export const apiPost = async (url: string, data = {}) => {
    try {
        console.log(`POST Request to: ${apiClient.defaults.baseURL}${url}`);
        console.log('Request Data:', data);
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