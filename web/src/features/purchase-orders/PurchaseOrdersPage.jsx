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

import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useToast } from '@hooks/useToast';
import { usePaginatedFetch } from '@hooks/usePaginatedFetch';
import AddPurchaseOrderModal from './modals/AddPurchaseOrderModal';
import POTable from './components/POTable';
import POEmailModal from './modals/POEmailModal';
import { Toast, PageToolbar, Pagination, EmptyState } from '@components/ui';



export default function PurchaseOrdersPage() {
  const { toast, showToast } = useToast();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  const {
    data: purchaseOrdersData,
    meta,
    loading,
    handlePageChange,
    handlePageSizeChange,
    refresh
  } = usePaginatedFetch(api.purchaseOrders.getPurchaseOrders, 1, 10, {
    search,
    status: filter === 'All' ? undefined : filter
  });

  const mappedPOs = useMemo(() => {
    return (purchaseOrdersData || []).map(po => ({
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
  }, [purchaseOrdersData]);

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
        refresh();
      } else {
        showToast(res.message || "Failed to create purchase order", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("An error occurred while saving purchase order", "error");
    }
  };

  const updatePOStatus = useCallback(async (id, status, attachment) => {
    try {
      const payload = { status };
      if (attachment) {
        payload.attachment = attachment;
      }
      const res = await api.purchaseOrders.updatePurchaseOrder(id, payload);
      if (res.success) {
        refresh();
        setSelectedPO(prev => prev?.id === id ? { ...prev, status, ...(attachment ? { attachment } : {}) } : prev);
      }
    } catch (e) {
      console.error("Failed to update PO status:", e);
    }
  }, [refresh]);



  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full h-full pb-4 relative">
      <Toast message={toast.message} type={toast.type} />

      {/* Centralized toolbar: search + status filter + Add PO button */}
      <PageToolbar
        search={search}
        onSearchChange={(val) => { setSearch(val); handlePageChange(1); }}
        searchPlaceholder="Search by customer or PO ID..."
        filterValue={filter}
        onFilterChange={(val) => { setFilter(val); handlePageChange(1); }}
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
        {mappedPOs.length > 0 ? (
          <POTable
            items={mappedPOs}
            onView={(po) => {
              navigate(`/purchase-orders/${po.id}`);
            }}
            onOrder={(po) => {
              setSelectedPO(po);
              setIsEmailModalOpen(true);
            }}
          />
        ) : (
          <EmptyState title="No purchase orders found" description="Create your first purchase order to get started" />
        )}


        {/* Centralized pagination footer */}
        <Pagination
          currentPage={meta.currentPage}
          totalPages={meta.totalPages}
          totalItems={meta.totalItems}
          itemsPerPage={meta.pageSize}
          onPrev={() => handlePageChange(meta.currentPage - 1)}
          onNext={() => handlePageChange(meta.currentPage + 1)}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handlePageSizeChange}
          itemLabel="orders"
        />
      </div>

      <AddPurchaseOrderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddPO}
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
