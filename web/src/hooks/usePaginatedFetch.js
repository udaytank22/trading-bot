import { useState, useEffect, useCallback } from 'react';

export function usePaginatedFetch(fetchFunction, initialPage = 1, initialPageSize = 10, additionalParams = {}) {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ totalItems: 0, currentPage: initialPage, pageSize: initialPageSize, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (page = meta.currentPage, pageSize = meta.pageSize, extra = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchFunction({ page, pageSize, ...additionalParams, ...extra });
      if (response && response.success) {
        setData(response.data || []);
        if (response.meta) {
          setMeta(response.meta);
        } else {
          // Fallback if backend doesn't send meta properly
          setMeta({
            totalItems: response.data.length || 0,
            currentPage: page,
            pageSize: pageSize,
            totalPages: Math.ceil((response.data.length || 0) / pageSize) || 1
          });
        }
      } else {
        setError(response?.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, additionalParams, meta.currentPage, meta.pageSize]);

  useEffect(() => {
    fetchData(initialPage, initialPageSize);
  }, []); // Run once on mount, then driven by UI interactions

  const handlePageChange = (newPage) => {
    setMeta(prev => ({ ...prev, currentPage: newPage }));
    fetchData(newPage, meta.pageSize);
  };

  const handlePageSizeChange = (newPageSize) => {
    setMeta(prev => ({ ...prev, pageSize: newPageSize, currentPage: 1 }));
    fetchData(1, newPageSize);
  };

  const refresh = () => {
    fetchData(meta.currentPage, meta.pageSize);
  };

  return { data, meta, loading, error, handlePageChange, handlePageSizeChange, refresh, fetchData };
}
