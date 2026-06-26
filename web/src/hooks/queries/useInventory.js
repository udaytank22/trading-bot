import { useState, useEffect } from 'react';
import { fetchInventory, getInventoryTransactionHistory } from '../../api/inventory';

export function useInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Transactions State
  const [transactions, setTransactions] = useState([]);
  const [txTotalItems, setTxTotalItems] = useState(0);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [txLoading, setTxLoading] = useState(false);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await fetchInventory();
      setInventory(res.data || res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (params) => {
    try {
      setTxLoading(true);
      const res = await getInventoryTransactionHistory(params);
      if (res.success) {
        setTransactions(res.data.items || []);
        setTxTotalItems(res.data.total || 0);
        setTxTotalPages(res.data.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to load transaction history:", error);
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  return {
    inventory,
    setInventory,
    loading,
    loadInventory,
    transactions,
    txTotalItems,
    txTotalPages,
    txLoading,
    loadTransactions
  };
}
