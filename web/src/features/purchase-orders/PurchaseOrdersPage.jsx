import { useAuth, useUI, useData } from '@context';
import { api } from '@services/api';
/**
 * @file PurchaseOrdersPage.jsx
 * @description Purchase Orders management page — list, add, view, send order emails.
 *
 * CENTRALIZED COMPONENTS USED:
 *   - PageToolbar → search + status filter + "Add Purchase Order" button
 *   - Pagination  → Previous/Next with order count
 *   - POTable     → table with View/Order actions
 *
 * DATA FLOW:
 *   AppContext.purchaseOrdersData → useMemo(filter) → paginate → POTable
 *
 * @author TradeMind Dev Team
 */

import React, { useState, useMemo, useContext, useCallback } from "react";

import { useToast } from '@hooks/useToast';
import AddPurchaseOrderModal from './modals/AddPurchaseOrderModal';
import POTable from './components/POTable';
import PODrawer from './drawers/PODrawer';
import POEmailModal from './modals/POEmailModal';
import { Toast, PageToolbar, Pagination } from '@components/ui';

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#1a1d23] min-h-[400px]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-14 h-14 text-white/10 mb-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
        />
      </svg>
      <h3 className="text-white text-lg font-bold mb-1.5">
        No purchase orders found
      </h3>
      <p className="text-gray-500 text-sm font-medium">
        Create your first purchase order to get started
      </p>
    </div>
  );
}

export default function PurchaseOrdersPage() {
  const { purchaseOrdersData, refreshAll } = useData();
  const { toast, showToast } = useToast();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const filteredPOs = useMemo(() => {
    let result = (purchaseOrdersData || []).filter((po) => {
      if (filter !== "All" && po.status !== filter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          po.customer.toLowerCase().includes(q) ||
          po.po_id.toLowerCase().includes(q) ||
          po.vessel.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return result.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [purchaseOrdersData, search, filter]);

  const totalPages = Math.ceil(filteredPOs.length / ITEMS_PER_PAGE);
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPOs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPOs, currentPage]);

  const handleAddPO = async (newPO) => {
    try {
      const payload = {
        supplierId: newPO.supplierId,
        clientId: newPO.clientId,
        amount: 0,
        items: newPO.products?.map(p => ({
          productId: p.productId || '',
          description: p.description || p.product || 'Product',
          quantity: parseInt(p.qty, 10) || 1,
          unitPrice: parseFloat(p.unitPrice) || 0,
          totalPrice: (parseInt(p.qty, 10) || 1) * (parseFloat(p.unitPrice) || 0)
        })) || []
      };

      payload.amount = payload.items.reduce((sum, item) => sum + item.totalPrice, 0);

      const res = await api.purchaseOrders.createPurchaseOrder(payload);
      if (res.success) {
        showToast("Purchase order created successfully", "success");
        refreshAll();
      } else {
        showToast(res.message || "Failed to create purchase order", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("An error occurred while saving purchase order", "error");
    }
  };

  const updatePOStatus = useCallback(async (id, status) => {
    try {
      const res = await api.purchaseOrders.updatePurchaseOrder(id, { status });
      if (res.success) {
        refreshAll();
        setSelectedPO(prev => prev?.id === id ? { ...prev, status } : prev);
      }
    } catch (e) {
      console.error("Failed to update PO status:", e);
    }
  }, [refreshAll]);

  const startShowing = filteredPOs.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endShowing = Math.min(currentPage * ITEMS_PER_PAGE, filteredPOs.length);


  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full h-full pb-4 relative">
      <Toast message={toast.message} type={toast.type} />

      {/* Centralized toolbar: search + status filter + Add PO button */}
      <PageToolbar
        search={search}
        onSearchChange={(val) => { setSearch(val); setCurrentPage(1); }}
        searchPlaceholder="Search by customer or PO ID..."
        filterValue={filter}
        onFilterChange={(val) => { setFilter(val); setCurrentPage(1); }}
        filterOptions={[
          { value: "All", label: "All Status" },
          { value: "PENDING", label: "Pending" },
          { value: "CONFIRMED", label: "Confirmed" },
          { value: "ORDERED", label: "Ordered" },
          { value: "SHIPPED", label: "Shipped" },
          { value: "CLOSED", label: "Closed" },
        ]}
        onAdd={() => setIsAddModalOpen(true)}
        addLabel="Add Purchase Order"
      />

      <div className="flex-1 w-full bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl overflow-hidden flex flex-col shadow-lg transition-colors duration-300">
        {filteredPOs.length > 0 ? (
          <POTable
            items={currentItems}
            onView={(po) => {
              setSelectedPO(po);
              setIsViewDrawerOpen(true);
            }}
            onOrder={(po) => {
              setSelectedPO(po);
              setIsEmailModalOpen(true);
            }}
          />
        ) : (
          <EmptyState />
        )}


        {/* Centralized pagination footer */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredPOs.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPrev={() => setCurrentPage((p) => p - 1)}
          onNext={() => setCurrentPage((p) => p + 1)}
            onPageChange={(p) => setCurrentPage(p)}
          itemLabel="orders"
        />
      </div>

      <AddPurchaseOrderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddPO}
      />

      <PODrawer
        po={selectedPO}
        isOpen={isViewDrawerOpen}
        onClose={() => setIsViewDrawerOpen(false)}
      />

      <POEmailModal
        po={selectedPO}
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onStatusUpdate={updatePOStatus}
      />
    </div>
  );
}
