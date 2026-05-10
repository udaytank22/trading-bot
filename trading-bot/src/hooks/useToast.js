import { useState, useCallback } from 'react';

/**
 * Custom hook to manage a toast notification.
 * Returns { toast, showToast } where toast = { message, type }.
 */
export function useToast(duration = 2500) {
  const [toast, setToast] = useState({ message: null, type: 'success' });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: null, type }), duration);
  }, [duration]);

  return { toast, showToast };
}
