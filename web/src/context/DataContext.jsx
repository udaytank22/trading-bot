// src/context/DataContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@services/api';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { currentUser } = useAuth();
  const [inquiriesData, setInquiriesData] = useState([]);
  const [supplyData, setSupplyData] = useState([]);
  const [purchaseOrdersData, setPurchaseOrdersData] = useState([]);
  const [employeesData, setEmployeesData] = useState([]);
  const [documentsData, setDocumentsData] = useState([]);
  const [accountsData, setAccountsData] = useState([]);
  const [invoicesData, setInvoicesData] = useState([]);
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
        inqRes,
        supRes,
        poRes,
        empRes,
        docRes,
        accRes,
        invRes,
        prodRes,
        cliRes,
        supplierRes,
      ] = await Promise.all([
        safeFetch(api.inquiries.getInquiries({ paginate: 'false' })),
        safeFetch(api.shipments.getShipments({ paginate: 'false' })),
        isClient ? { success: true, data: [] } : safeFetch(api.purchaseOrders.getPurchaseOrders({ paginate: 'false' })),
        isClient ? { success: true, data: [] } : safeFetch(api.employees.getEmployees({ paginate: 'false' })),
        isClient ? { success: true, data: [] } : safeFetch(api.documents.getDocuments({ paginate: 'false' })),
        isClient ? { success: true, data: [] } : safeFetch(api.bankAccounts.getBankAccounts({ paginate: 'false' })),
        safeFetch(api.invoices.getInvoices({ paginate: 'false' })), // Both clients and admins need invoices
        isClient ? { success: true, data: [] } : safeFetch(api.products.getProducts({ paginate: 'false' })),
        isClient ? { success: true, data: [] } : safeFetch(api.clients.getClients({ paginate: 'false' })),
        safeFetch(api.suppliers.getSuppliers({ paginate: 'false' })),
      ]);

      if (inqRes.success) setInquiriesData(inqRes.data ?? []);
      if (supRes.success) {
        const mappedSupply = (supRes.data ?? []).map(ship => ({
          ...ship,
          inquiry_id: ship.id,
          supplier: ship.supplier?.name || 'Unknown Supplier',
          buyer_email: ship.client?.email || '',
          cargo: ship.cargoDetails || 'General Cargo',
          quantity: '1 Lot',
          destination: ship.client?.address || 'N/A',
          status: ship.currentStatus,
          date: ship.createdAt
        }));
        setSupplyData(mappedSupply);
      }
      if (poRes.success) {
        const mappedPOs = (poRes.data ?? []).map(po => ({
          ...po,
          po_id: po.poNumber,
          total_amount: parseFloat(po.amount || 0),
          customer: po.client?.name || 'Unknown',
          vessel: po.inquiry?.vesselName || 'N/A',
          date: po.createdAt,
          products: po.items?.map(item => ({
            product_name: item.description,
            quantity: item.quantity,
            unit_price: parseFloat(item.unitPrice || 0),
            total_price: parseFloat(item.totalPrice || 0)
          })) || []
        }));
        setPurchaseOrdersData(mappedPOs);
      }
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
      if (docRes.success) {
        const mappedDocs = (docRes.data ?? []).map(doc => ({
          ...doc,
          entityName: doc.entityId || '',
          status: doc.status === 'VALID' ? 'Valid' : (doc.status === 'EXPIRING_SOON' ? 'Expiring Soon' : (doc.status === 'EXPIRED' ? 'Expired' : (doc.status || 'Valid')))
        }));
        setDocumentsData(mappedDocs);
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
      if (invRes.success) {
        const mappedInvoices = (invRes.data ?? []).map(inv => ({
          ...inv,
          inquiry_id: inv.id,
          buyer_name: inv.client?.name || 'Unknown Buyer',
          buyer_email: inv.client?.email || '',
          cargo: inv.shipment?.cargoDetails || 'General Cargo',
          invoice_date: inv.invoiceDate,
          invoice_status: inv.status,
          products: inv.items?.map(item => ({
            product_name: item.description,
            quantity: item.quantity,
            total_price: item.totalPrice
          })) || []
        }));
        setInvoicesData(mappedInvoices);
      }
      if (prodRes.success) setProductsData(prodRes.data ?? []);
      if (cliRes.success) setClientsData(cliRes.data ?? []);
      if (supplierRes.success) setSuppliersData(supplierRes.data ?? []);
    } catch (e) {
      console.error('Failed to load all data from backend:', e);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return (
    <DataContext.Provider value={{
      inquiriesData, setInquiriesData,
      supplyData, setSupplyData,
      purchaseOrdersData, setPurchaseOrdersData,
      employeesData, setEmployeesData,
      documentsData, setDocumentsData,
      accountsData, setAccountsData,
      invoicesData, setInvoicesData,
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
