// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { STORAGE_KEYS } from '@config/constants';

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

  const login = useCallback((user) => {
    const profile = user || { name: 'Admin', role: 'admin', email: 'admin@trademind.com' };
    setIsAuthenticated(true);
    setCurrentUser(profile);
    localStorage.setItem(STORAGE_KEYS.IS_AUTH, 'true');
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.IS_AUTH);
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  }, []);

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
