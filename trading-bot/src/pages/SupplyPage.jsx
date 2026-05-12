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

import React, { useMemo, useState } from "react";
import ContactModal from "../components/ContactModal";
import SupplyViewModal from "../components/SupplyViewModal";
import SupplyTable from "../components/SupplyTable";
import { AppContext } from "../context";
import { PageToolbar, Pagination } from "../components/ui";

// ─── Filter dropdown options ───────────────────────────────────────────────────
const FILTER_OPTIONS = [
  { value: "All",        label: "All Status" },
  { value: "PENDING",    label: "Pending" },
  { value: "LOADING",    label: "Loading" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "DELIVERED",  label: "Delivered" },
];

const ITEMS_PER_PAGE = 5;

// ─── Main Page Component ───────────────────────────────────────────────────────
export default function SupplyPage() {
  const { supplyData, setSupplyData } = React.useContext(AppContext);

  // ── Local UI state ────────────────────────────────────────────────────────
  const [search, setSearch]         = useState("");
  const [filter, setFilter]         = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  // View modal state (SupplyViewModal)
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isModalOpen, setIsModalOpen]   = useState(false);

  // Contact modal state (ContactModal)
  const [contactModalDeal, setContactModalDeal] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

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
  const totalPages   = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
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
      <div className="bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl overflow-hidden shadow-sm transition-colors duration-300">

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
        />

        {/* Centralized pagination footer */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredData.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPrev={() => setCurrentPage((p) => p - 1)}
          onNext={() => setCurrentPage((p) => p + 1)}
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
    </div>
  );
}
