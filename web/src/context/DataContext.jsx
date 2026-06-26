import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@services/api';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { currentUser } = useAuth();
  
  // Reference data only
  const [employeesData, setEmployeesData] = useState([]);
  const [accountsData, setAccountsData] = useState([]);
  const [productsData, setProductsData] = useState([]);
  const [clientsData, setClientsData] = useState([]);
  const [suppliersData, setSuppliersData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAllData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);

    const isClient = currentUser?.role?.toLowerCase() === 'client';

    const safeFetch = async (apiCall, fallback = { success: false, data: [] }) => {
      try {
        const res = await apiCall;
        return res || fallback;
      } catch (err) {
        console.warn('API call failed:', err);
        return fallback;
      }
    };

    try {
      const [
        empRes,
        accRes,
        prodRes,
        cliRes,
        supplierRes,
      ] = await Promise.all([
        isClient ? { success: true, data: [] } : safeFetch(api.employees.getEmployees({ pageSize: 500 })),
        isClient ? { success: true, data: [] } : safeFetch(api.bankAccounts.getBankAccounts({ pageSize: 500 })),
        isClient ? { success: true, data: [] } : safeFetch(api.products.getProducts({ pageSize: 500 })),
        isClient ? { success: true, data: [] } : safeFetch(api.clients.getClients({ pageSize: 500 })),
        safeFetch(api.suppliers.getSuppliers({ pageSize: 500 })),
      ]);

      if (empRes.success) {
        const mappedEmps = (empRes.data ?? []).map(emp => ({
          ...emp,
          name: emp.fullName || emp.name || '',
          role: emp.designation || emp.role || '',
          status: emp.status === 'ACTIVE' ? 'Active' : (emp.status === 'INACTIVE' ? 'Inactive' : (emp.status || 'Active')),
          avatar: (emp.fullName || emp.name || '')
            .split(" ")
            .filter(Boolean)
            .map((n) => n[0])
            .join("")
            .toUpperCase()
        }));
        setEmployeesData(mappedEmps);
      }
      
      if (accRes.success) {
        const mappedAccs = (accRes.data ?? []).map(acc => ({
          ...acc,
          accountName: acc.accountHolderName || acc.accountName || '',
          balance: acc.balance !== undefined ? acc.balance : 0.00,
          status: acc.status === 'ACTIVE' ? 'Active' : (acc.status === 'INACTIVE' ? 'Inactive' : (acc.status || 'Active'))
        }));
        setAccountsData(mappedAccs);
      }
      
      if (prodRes.success) setProductsData(prodRes.data ?? []);
      if (cliRes.success) setClientsData(cliRes.data ?? []);
      if (supplierRes.success) setSuppliersData(supplierRes.data ?? []);
    } catch (e) {
      console.error('Failed to load reference data from backend:', e);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Keep empty setter/getters for transactional data to prevent immediate crash if a component still destructures them
  // The individual pages should use usePaginatedFetch instead of these.
  const emptyArr = [];
  const noop = () => {};

  return (
    <DataContext.Provider value={{
      inquiriesData: emptyArr, setInquiriesData: noop,
      supplyData: emptyArr, setSupplyData: noop,
      purchaseOrdersData: emptyArr, setPurchaseOrdersData: noop,
      invoicesData: emptyArr, setInvoicesData: noop,
      documentsData: emptyArr, setDocumentsData: noop,
      
      employeesData, setEmployeesData,
      accountsData, setAccountsData,
      productsData, setProductsData,
      clientsData, setClientsData,
      suppliersData, setSuppliersData,
      loading,
      refreshAll: loadAllData,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
