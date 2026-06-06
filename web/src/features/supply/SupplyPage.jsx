import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useUI, useData } from '@context';
import { api } from '@services/api';
import { usePaginatedFetch } from '@hooks/usePaginatedFetch';
import ContactModal from '@features/accounts/modals/ContactModal';
import AddSupplyModal from './modals/AddSupplyModal';
import AllotVehicleModal from '@features/employees/modals/AllotVehicleModal';
import InvoiceEmailModal from '@features/invoices/modals/InvoiceEmailModal';
import SupplyTable from './components/SupplyTable';

import { PageToolbar, Pagination } from '@components/ui';

/**
 * @file SupplyPage.jsx
 * @description Cargo / Supply tracking page — list, view details, contact supplier.
 *
 * CENTRALIZED COMPONENTS USED:
 *   - PageToolbar  → search + status filter (no add button — supply is created
 *                    automatically when an inquiry is confirmed)
 *   - Pagination   → Previous/Next with cargo count
 *   - SupplyTable  → table with View/Contact actions
 *
 * NOTE ON "ADD SUPPLY":
 *   The "Add Supply" button is present but opens a modal that is not yet
 *   implemented. State is declared to prevent crashes (BUG-01 fix).
 *   TODO: Implement AddSupplyModal once the spec is defined.
 *
 * DATA FLOW:
 *   AppContext.supplyData → useMemo(search+filter) → sort(date desc) → paginate → SupplyTable
 *
 * @author TradeMind Dev Team
 */

// ─── Filter dropdown options ───────────────────────────────────────────────────
const FILTER_OPTIONS = [
  { value: "All", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "ORDER_PLACED", label: "Order Placed" },
  { value: "DISPATCHED", label: "Dispatched" },
  { value: "LOADING", label: "Loading" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "DELIVERED", label: "Delivered" },
];



// ─── Main Page Component ───────────────────────────────────────────────────────
export default function SupplyPage() {
  const { setSupplyData } = useData();
  const navigate = useNavigate();

  // ── Local UI state ────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const {
    data: supplyData,
    meta,
    loading,
    handlePageChange,
    handlePageSizeChange,
    refresh
  } = usePaginatedFetch(api.shipments.getShipments, 1, 10, {
    search,
    status: filter === 'All' ? undefined : filter
  });

  // Contact modal state (ContactModal)
  const [contactModalDeal, setContactModalDeal] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Allot Vehicle modal state
  const [allotModalDeal, setAllotModalDeal] = useState(null);
  const [isAllotModalOpen, setIsAllotModalOpen] = useState(false);

  // Invoice Email modal state
  const [invoiceModalDeal, setInvoiceModalDeal] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Add supply modal state — TODO: wire to AddSupplyModal when implemented
  // Declared here to prevent the "Add Supply" button from crashing (BUG-01 fix)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const mappedSupply = useMemo(() => {
    return (supplyData || []).map(item => ({
      ...item,
      supplier: item.supplier?.name || item.supplier || 'Unknown Supplier',
      cargo: item.inquiry?.items?.[0]?.description || item.cargo || 'Cargo',
      destination: item.inquiry?.vesselName || item.destination || 'Destination',
      date: item.createdAt || item.date
    }));
  }, [supplyData]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleStatusUpdate = async (id, newStatus) => {
    if (newStatus === "SUPPLY") { // Transition to SUPPLY status
      const res = await api.shipments.updateShipment(id, { currentStatus: "SUPPLY" });
      if (res.success) {
        refresh();
      }
      return;
    }
    if (newStatus === "SEND_INVOICE") {
      const deal = supplyData.find((d) => d.inquiry_id === id);
      if (deal) {
        setInvoiceModalDeal(deal);
        setIsInvoiceModalOpen(true);
      }
      return;
    }

    if (newStatus === "INVOICE_SENT") {
      const deal = supplyData.find((d) => d.inquiry_id === id);
      if (deal) {
        try {
          const res = await api.shipments.updateShipment(id, { currentStatus: "DELIVERED" });
          if (res.success) {
            const invoicePayload = {
              clientId: deal.clientId,
              inquiryId: deal.inquiryId,
              shipmentId: deal.id,
              subtotal: 1000.00,
              status: 'SENT',
              items: deal.products?.map(p => ({
                description: p.product_name || 'Product',
                quantity: p.quantity || 1,
                unitPrice: p.price || 1000.00,
                totalPrice: (p.quantity || 1) * (p.price || 1000.00)
              })) || []
            };
            await api.invoices.createInvoice(invoicePayload);
            refresh();
          }
        } catch (e) {
          console.error("Failed to transition shipment to invoice:", e);
        }
      }
      return;
    }

    try {
      const res = await api.shipments.updateShipment(id, { currentStatus: newStatus });
      if (res.success) {
        refresh();
      }
    } catch (e) {
      console.error("Failed to update shipment status:", e);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full h-full pb-4">
      {/*
       * CENTRALIZED TOOLBAR
       * "Add Supply" triggers isAddModalOpen — modal not yet implemented.
       * Remove `onAdd` prop to hide the button until AddSupplyModal is built.
       */}
      <PageToolbar
        search={search}
        onSearchChange={(val) => { setSearch(val); handlePageChange(1); }}
        searchPlaceholder="Search by supplier, cargo or destination..."
        filterValue={filter}
        onFilterChange={(val) => { setFilter(val); handlePageChange(1); }}
        filterOptions={FILTER_OPTIONS}
        onAdd={() => setIsAddModalOpen(true)}
        addLabel="Add Supply"
      />

      {/* ── Table card ─────────────────────────────────────────────────────── */}
      <div className="flex-1 w-full bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl overflow-hidden flex flex-col shadow-lg transition-colors duration-300">

        {/*
         * SupplyTable — getStatusStyle prop removed.
         * StatusBadge inside SupplyTable now handles all supply statuses directly.
         */}
        <SupplyTable
          items={mappedSupply}
          onView={(item) => {
            navigate(`/supply/${item.inquiry_id}`);
          }}
          onContact={(item) => {
            setContactModalDeal(item);
            setIsContactModalOpen(true);
          }}
          onAllot={(item) => {
            setAllotModalDeal(item);
            setIsAllotModalOpen(true);
          }}
          onStatusUpdate={handleStatusUpdate}
        />

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
          itemLabel="cargo supplies"
        />
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}



      {/* Contact supplier modal */}
      <ContactModal
        deal={contactModalDeal}
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />

      {/* Allot Vehicle Modal */}
      <AllotVehicleModal
        deal={allotModalDeal}
        isOpen={isAllotModalOpen}
        onClose={() => setIsAllotModalOpen(false)}
        onAllot={async (id, vehicle) => {
          try {
            const res = await api.shipments.updateShipment(id, {
              currentStatus: "LOADING",
              vehicleDetails: vehicle.vehicle_no,
              driverDetails: `${vehicle.driver_name || vehicle.owner_name} (${vehicle.phone || vehicle.owner_phone})`
            });
            if (res.success) {
              refresh();
            }
          } catch (e) {
            console.error("Failed to allot vehicle:", e);
          }
        }}
      />

      {/* Invoice Email Modal */}
      <InvoiceEmailModal
        deal={invoiceModalDeal}
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* Add Supply Modal */}
      <AddSupplyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={(newSupply) => {
          setSupplyData((prev) => [newSupply, ...prev]);
        }}
      />
    </div>
  );
}
