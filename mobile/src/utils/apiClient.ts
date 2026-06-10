import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';
import { API_MESSAGES } from '../constants/apiMessages';

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to attach bearer token
    this.instance.interceptors.request.use(
      async (config) => {
        try {
          const userProfileStr = await AsyncStorage.getItem('user_profile');
          if (userProfileStr) {
            const userProfile = JSON.parse(userProfileStr);
            if (userProfile?.token && config.headers) {
              config.headers.Authorization = `Bearer ${userProfile.token}`;
            }
          }
        } catch (e) {
          console.warn('Error reading token from AsyncStorage', e);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for handling general HTTP errors
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Generic request wrapper with try-catch & typed responses
   */
  public async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.instance.request(config);
      return response.data;
    } catch (error: any) {
      let errorMessage = API_MESSAGES.GENERAL.UNKNOWN_ERROR;

      if (error.response) {
        // The server responded with a status code that falls out of the range of 2xx
        errorMessage = error.response.data?.message || error.response.data?.error || `${API_MESSAGES.GENERAL.SERVER_ERROR} (${error.response.status})`;
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = API_MESSAGES.GENERAL.NETWORK_ERROR;
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  }

  // HTTP helper shorthand methods
  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  public patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }
}

export const apiClient = new ApiClient();
