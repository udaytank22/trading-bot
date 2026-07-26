// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { STORAGE_KEYS } from '@config/constants';
import { API_BASE_URL } from '../config/env';
import apiClient from '../services/apiClient';
import { getAccessToken, setAccessToken, clearAccessToken } from '../services/tokenStore';

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
  const [isInitializing, setIsInitializing] = useState(() => {
    return !(localStorage.getItem(STORAGE_KEYS.IS_AUTH) === 'true');
  });

  const login = useCallback((user, token) => {
    const profile = user || { name: 'Admin', role: 'admin', email: 'admin@trademind.com' };
    setIsAuthenticated(true);
    setCurrentUser(profile);
    localStorage.setItem(STORAGE_KEYS.IS_AUTH, 'true');
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    if (token) {
      setAccessToken(token);
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
    clearAccessToken();
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

    const lowerRole = (roleName || '').toLowerCase();
    if (lowerRole === 'admin') return true;

    const permissions = currentUser.roleData?.permissions || [];
    if (permissions.length === 0) return true;

    return permissions.some(rp => {
      const perm = rp.permission;
      if (!perm) return false;
      return perm.module.toLowerCase() === moduleName.toLowerCase() &&
        perm.action.toLowerCase() === actionName.toLowerCase();
    });
  }, [currentUser]);

  // On App Startup / Page Refresh: Perform silent refresh via httpOnly refresh cookie
  useEffect(() => {
    let isMounted = true;
    async function initAuth() {
      const existingToken = getAccessToken();
      if (existingToken) {
        try {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${existingToken}`;
        } catch (e) { }
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {}, { withCredentials: true });
        const resData = response.data;
        if (resData && resData.success) {
          const newToken = resData.accessToken || resData.token || resData.data?.accessToken || resData.data?.token;
          if (newToken) {
            setAccessToken(newToken);
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          }

          const userObj = resData.user || resData.data?.user;
          if (isMounted) {
            setIsAuthenticated(true);
            if (userObj) {
              const profile = {
                id: userObj.id,
                name: userObj.employeeProfile?.fullName || userObj.name || (userObj.email?.split('@')[0]),
                role: userObj.role?.name || userObj.role || 'User',
                email: userObj.email,
                roleData: userObj.role
              };
              setCurrentUser(profile);
              localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
              localStorage.setItem(STORAGE_KEYS.IS_AUTH, 'true');
            }
          }
        }
      } catch (err) {
        if (!existingToken && isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    initAuth();
    return () => { isMounted = false; };
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
    if (isAuthenticated && !isInitializing) {
      refreshUserProfile();
    }
  }, [isAuthenticated, isInitializing, refreshUserProfile]);

  useEffect(() => {
    if (!isAuthenticated || isInitializing) return;

    // Proactively refresh access token every 10 minutes (access token expires in 15m)
    const refreshInterval = setInterval(async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {}, { withCredentials: true });

        if (response.data && response.data.success) {
          const newToken = response.data.accessToken || response.data.token || response.data.data?.accessToken || response.data.data?.token;
          if (newToken) {
            setAccessToken(newToken);
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          }
        }
      } catch (err) {
        console.error('Proactive token refresh failed:', err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          logout();
        }
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, isInitializing, logout]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, setCurrentUser, login, logout, hasPermission, refreshUserProfile, isInitializing }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
