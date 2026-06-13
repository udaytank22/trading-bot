import { useState, useCallback } from 'react';
import Swal from 'sweetalert2';

/**
 * Custom hook to manage a toast notification.
 * Returns { toast, showToast } where toast = { message, type }.
 */
export function useToast(duration = 2500) {
  const [toast, setToast] = useState({ message: null, type: 'success' });

  const showToast = useCallback((message, type = 'success') => {
    // No longer need to check Swal.isVisible() since global Swal toasts were removed.
    // This allows showToast to run even if a Swal confirmation dialog is closing.

    setToast({ message, type });
    setTimeout(() => setToast({ message: null, type }), duration);
  }, [duration]);

  return { toast, showToast };
}
