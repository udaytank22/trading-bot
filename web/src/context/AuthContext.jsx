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

  const login = useCallback((user, token) => {
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
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.IS_AUTH);
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    localStorage.removeItem('token');
    try {
      delete apiClient.defaults.headers.common['Authorization'];
    } catch (e) {
      console.warn('Failed to clear Axios Authorization header', e);
    }
  }, []);

  const refreshUserProfile = useCallback(async () => {
    try {
      const response = await apiClient.get('/auth/me');
      if (response.data && response.data.success) {
        const user = response.data.data;
        const profile = {
          id: user.id,
          name: user.employeeProfile ? user.employeeProfile.fullName : (user.email.split('@')[0]),
          role: user.role ? user.role.name : "User",
          email: user.email,
          roleData: user.role
        };
        setCurrentUser(profile);
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  }, []);

  const hasPermission = useCallback((moduleName, actionName) => {
    if (!currentUser) return false;
    
    const roleName = typeof currentUser.role === 'string'
      ? currentUser.role
      : currentUser.roleData?.name;
      
    if (roleName === 'Super Admin') return true;

    const permissions = currentUser.roleData?.permissions || [];
    return permissions.some(rp => {
      const perm = rp.permission;
      if (!perm) return false;
      return perm.module.toLowerCase() === moduleName.toLowerCase() &&
             perm.action.toLowerCase() === actionName.toLowerCase();
    });
  }, [currentUser]);

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
    if (isAuthenticated) {
      refreshUserProfile();
    }
  }, [isAuthenticated, refreshUserProfile]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Proactively refresh access token every 10 minutes (since access token expires in 15m)
    const refreshInterval = setInterval(async () => {
      try {
        const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
        const response = await axios.post(`${BASE_URL}/api/auth/refresh`, {}, { withCredentials: true });

        if (response.data && response.data.success) {
          const newToken = response.data.data.accessToken || response.data.data.token;

          localStorage.setItem('token', newToken);
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
    <AuthContext.Provider value={{ isAuthenticated, currentUser, setCurrentUser, login, logout, hasPermission, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
