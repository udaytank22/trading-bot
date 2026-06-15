// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { STORAGE_KEYS } from '@config/constants';
import apiClient from '../services/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem(STORAGE_KEYS.IS_AUTH) === 'true'
  );
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const login = useCallback((user, token, refreshToken) => {
    const profile = user || { name: 'Admin', role: 'admin', email: 'admin@trademind.com' };
    setIsAuthenticated(true);
    setCurrentUser(profile);
    sessionStorage.setItem(STORAGE_KEYS.IS_AUTH, 'true');
    sessionStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    if (token) {
      sessionStorage.setItem('token', token);
      // Update Axios default Authorization header immediately
      try {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (e) {
        console.warn('Failed to set Axios default Authorization header', e);
      }
    }
    if (refreshToken) {
      sessionStorage.setItem('refreshToken', refreshToken);
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    sessionStorage.removeItem(STORAGE_KEYS.IS_AUTH);
    sessionStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
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
