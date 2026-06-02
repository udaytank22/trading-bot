// src/context/UIContext.jsx
import React, { createContext, useContext, useState, useCallback, useLayoutEffect } from 'react';
import { STORAGE_KEYS, THEME } from '@config/constants';

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // as updated previously
  const [theme, setTheme] = useState(
    () => localStorage.getItem(STORAGE_KEYS.THEME) || THEME.DARK
  );
  const [activeCall, setActiveCall] = useState(null);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    root.classList.remove(THEME.LIGHT, THEME.DARK);
    root.classList.add(theme);
    body.classList.remove(THEME.LIGHT, THEME.DARK);
    body.classList.add(theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleSidebar = useCallback(() => setIsSidebarOpen(p => !p), []);
  const toggleTheme = useCallback(() => setTheme(p => p === THEME.DARK ? THEME.LIGHT : THEME.DARK), []);
  const startCall = useCallback((user, type = 'voice') => setActiveCall({ caller: user, type, status: 'ongoing', startTime: Date.now(), duration: 0 }), []);
  const endCall = useCallback(() => setActiveCall(null), []);

  return (
    <UIContext.Provider value={{ isSidebarOpen, theme, activeCall, toggleSidebar, toggleTheme, startCall, endCall }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
