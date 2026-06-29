import { useState, useEffect, useCallback } from 'react';

/**
 * useTablePageSize
 * 
 * A custom hook that manages table pagination size across the application.
 * It reads from and writes to localStorage, and listens to a custom event
 * so that when the user changes the page size in one table, all tables update.
 * 
 * @param {number} defaultSize - The default page size if none is saved (defaults to 50)
 * @returns {[number, function]} - [pageSize, setPageSize] tuple just like useState
 */
export function useTablePageSize(defaultSize = 50) {
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem('tablePageSize');
    return saved ? parseInt(saved, 10) : defaultSize;
  });

  const updatePageSize = useCallback((newSize) => {
    setPageSize(newSize);
    localStorage.setItem('tablePageSize', newSize.toString());
    window.dispatchEvent(new CustomEvent('tablePageSizeChanged', { detail: newSize }));
  }, []);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.type === 'tablePageSizeChanged') {
        setPageSize(e.detail);
      } else if (e.key === 'tablePageSize' && e.newValue) {
        setPageSize(parseInt(e.newValue, 10));
      }
    };

    window.addEventListener('tablePageSizeChanged', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('tablePageSizeChanged', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return [pageSize, updatePageSize];
}
