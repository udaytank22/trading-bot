import { useState, useEffect, useCallback, useRef } from 'react';

export function usePaginatedFetch(fetchFunction, initialPage = 1, initialPageSize = 10, additionalParams = {}) {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ totalItems: 0, currentPage: initialPage, pageSize: initialPageSize, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Keep a ref to always have the latest meta without needing it as a dep
  const metaRef = useRef(meta);
  useEffect(() => { metaRef.current = meta; }, [meta]);

  // Keep a ref to always have the latest additionalParams without triggering re-fetch on every render
  const additionalParamsRef = useRef(additionalParams);
  useEffect(() => { additionalParamsRef.current = additionalParams; }, [additionalParams]);

  const fetchData = useCallback(async (page, pageSize, extra = {}) => {
    const currentPage = page !== undefined ? page : metaRef.current.currentPage;
    const currentPageSize = pageSize !== undefined ? pageSize : metaRef.current.pageSize;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchFunction({ page: currentPage, pageSize: currentPageSize, ...additionalParamsRef.current, ...extra });
      if (response && response.success) {
        setData(response.data || []);
        if (response.meta) {
          setMeta(response.meta);
        } else {
          // Fallback if backend doesn't send meta properly
          setMeta({
            totalItems: (response.data || []).length,
            currentPage: currentPage,
            pageSize: currentPageSize,
            totalPages: Math.ceil(((response.data || []).length) / currentPageSize) || 1
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
  }, [fetchFunction]);

  const paramsString = JSON.stringify(additionalParams);
  const isMounted = useRef(false);

  useEffect(() => {
    if (isMounted.current) {
      setMeta(prev => ({ ...prev, currentPage: 1 }));
      fetchData(1, metaRef.current.pageSize);
    } else {
      isMounted.current = true;
      fetchData(initialPage, initialPageSize);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsString, fetchFunction]);

  const handlePageChange = useCallback((newPage) => {
    setMeta(prev => ({ ...prev, currentPage: newPage }));
    fetchData(newPage, metaRef.current.pageSize);
  }, [fetchData]);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setMeta(prev => ({ ...prev, pageSize: newPageSize, currentPage: 1 }));
    fetchData(1, newPageSize);
  }, [fetchData]);

  const refresh = useCallback((silent = false) => {
    fetchData(metaRef.current.currentPage, metaRef.current.pageSize);
  }, [fetchData]);

  return { data, meta, loading, error, handlePageChange, handlePageSizeChange, refresh, fetchData };
}
