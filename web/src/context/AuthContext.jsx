// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { STORAGE_KEYS } from '@config/constants';
import apiClient from '../services/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem(STORAGE_KEYS.IS_AUTH) === 'true'
  );
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const login = useCallback((user, token, refreshToken) => {
    const profile = user || { name: 'Admin', role: 'admin', email: 'admin@trademind.com' };
    setIsAuthenticated(true);
    setCurrentUser(profile);
    localStorage.setItem(STORAGE_KEYS.IS_AUTH, 'true');
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    if (token) {
      localStorage.setItem('token', token);
      // Update Axios default Authorization header immediately
      try {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (e) {
        console.warn('Failed to set Axios default Authorization header', e);
      }
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.IS_AUTH);
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    try {
      delete apiClient.defaults.headers.common['Authorization'];
    } catch (e) {
      console.warn('Failed to clear Axios Authorization header', e);
    }
  }, []);

  useEffect(() => {
    const handleAuthLogout = () => {
      logout();
    };
    window.addEventListener('auth-logout', handleAuthLogout);
    return () => {
      window.removeEventListener('auth-logout', handleAuthLogout);
    };
  }, [logout]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Proactively refresh access token every 10 minutes (since access token expires in 15m)
    const refreshInterval = setInterval(async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return;

      try {
        const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const response = await axios.post(`${BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });

        if (response.data && response.data.success) {
          const newToken = response.data.data.accessToken || response.data.data.token;
          const newRefreshToken = response.data.data.refreshToken;

          localStorage.setItem('token', newToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        }
      } catch (err) {
        console.error('Proactive token refresh failed:', err);
        logout();
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, logout]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, setCurrentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
