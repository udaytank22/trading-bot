import React, { useMemo, useState } from "react";
import { useAuth, useUI, useData } from '@context';
import { api } from '@services/api';
import ContactModal from '@features/accounts/modals/ContactModal';
import SupplyViewModal from './modals/SupplyViewModal';
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
  { value: "LOADING", label: "Loading" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "DELIVERED", label: "Delivered" },
];

const ITEMS_PER_PAGE = 5;

// ─── Main Page Component ───────────────────────────────────────────────────────
export default function SupplyPage() {
  const { supplyData, refreshAll } = useData();

  // ── Local UI state ────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  // View modal state (SupplyViewModal)
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // ── Derived: filter + sort supply records ─────────────────────────────────
  const filteredData = useMemo(() => {
    let result = supplyData.filter((item) => {
      // Apply status filter
      if (filter !== "All" && item.status !== filter) return false;

      // Apply text search across supplier, cargo, destination
      const q = search.toLowerCase();
      return (
        item.supplier.toLowerCase().includes(q) ||
        item.cargo.toLowerCase().includes(q) ||
        item.destination.toLowerCase().includes(q)
      );
    });

    // Sort newest shipments first by date
    return result.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [search, filter, supplyData]);

  // ── Derived: paginate ─────────────────────────────────────────────────────
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleStatusUpdate = async (id, newStatus) => {
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
            refreshAll();
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
        refreshAll();
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
        onSearchChange={(val) => { setSearch(val); setCurrentPage(1); }}
        searchPlaceholder="Search by supplier, cargo or destination..."
        filterValue={filter}
        onFilterChange={(val) => { setFilter(val); setCurrentPage(1); }}
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
          items={currentItems}
          onView={(item) => {
            setSelectedDeal(item);
            setIsModalOpen(true);
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
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredData.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPrev={() => setCurrentPage((p) => p - 1)}
          onNext={() => setCurrentPage((p) => p + 1)}
            onPageChange={(p) => setCurrentPage(p)}
          itemLabel="cargo supplies"
        />
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {/* Detail view modal for a cargo record */}
      <SupplyViewModal
        deal={selectedDeal}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStatusUpdate={(id, status) => console.log("Status update:", id, status)} // TODO: wire to context
      />

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
              driverDetails: `${vehicle.owner_name} (${vehicle.owner_phone})`
            });
            if (res.success) {
              refreshAll();
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
