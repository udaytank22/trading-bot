import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useUI, useData } from '@context';
import { api } from '@services/api';
import { usePaginatedFetch } from '@hooks/usePaginatedFetch';
import ContactModal from '@features/accounts/modals/ContactModal';
import AddSupplyModal from './modals/AddSupplyModal';
import AllotVehicleModal from '@features/employees/modals/AllotVehicleModal';
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
  const { hasPermission } = useAuth();

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



  // Add supply modal state — TODO: wire to AddSupplyModal when implemented
  // Declared here to prevent the "Add Supply" button from crashing (BUG-01 fix)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const mappedSupply = useMemo(() => {
    const groups = {};
    const singles = [];

    (supplyData || []).forEach(item => {
      if (item.inquiryId) {
        if (!groups[item.inquiryId]) {
          groups[item.inquiryId] = {
            ...item,
            id: `inq-${item.inquiryId}`,
            isGrouped: true,
            shipmentNumber: item.inquiry?.inquiryNumber ? `ORD-${item.inquiry.inquiryNumber}` : `ORD-${item.inquiryId}`,
            supplier: '',
            cargo: '',
            destination: item.inquiry?.vesselName || item.inquiry?.vessel || item.client?.name || item.destination || '—',
            status: item.currentStatus || item.status || '—',
            date: item.createdAt || item.date,
            subShipments: []
          };
        }
        
        const group = groups[item.inquiryId];
        group.subShipments.push(item);
        
        const suppliers = Array.from(new Set(group.subShipments.map(s => s.supplier?.name || s.supplier || 'Unknown')));
        group.supplier = suppliers.join(', ');
        
        group.customer = group.subShipments[0]?.client?.name || group.subShipments[0]?.inquiry?.customer || '—';
        group.vessel = group.subShipments[0]?.inquiry?.vesselName || group.subShipments[0]?.inquiry?.vessel || group.subShipments[0]?.destination || '—';
        
        const cargoItems = new Set();
        group.subShipments.forEach(s => {
          if (s.purchaseOrder?.items) {
             s.purchaseOrder.items.forEach(i => cargoItems.add(i.product?.name || i.description || 'Product'));
          } else if (s.cargoDetails) {
             cargoItems.add(s.cargoDetails);
          } else if (s.cargo) {
             cargoItems.add(s.cargo);
          }
        });
        group.products = Array.from(cargoItems).map(name => ({ product_name: name }));
        group.cargo = Array.from(cargoItems).join(', ') || 'Cargo';
        
      } else {
        singles.push({
          ...item,
          supplier: item.supplier?.name || item.supplier || 'Unknown Supplier',
          customer: item.client?.name || item.inquiry?.customer || '—',
          vessel: item.inquiry?.vesselName || item.inquiry?.vessel || item.destination || '—',
          cargo: item.cargoDetails || item.cargo || 'Cargo',
          products: [{ product_name: item.cargoDetails || item.cargo || 'Cargo' }],
          destination: item.inquiry?.vesselName || item.inquiry?.vessel || item.client?.name || item.destination || '—',
          status: item.currentStatus || item.status || '—',
          date: item.createdAt || item.date
        });
      }
    });

    const STATUS_RANK = {
      'ORDER PLACED': 1,
      'ORDER_PLACED': 1,
      'ORDERED': 1,
      'PENDING': 1,
      'CONFIRMED': 1,
      'VEHICLE_ALLOTTED': 2,
      'LOADING': 2,
      'IN_TRANSIT': 3,
      'DISPATCHED': 3,
      'DELIVERED': 4,
      'OUT_FOR_DELIVERY': 5,
      'DELIVERED_TO_VESSEL': 6,
      'DELIVERED TO VESSEL': 6,
      'CHALLAN_RECEIVED': 7,
      'CLOSED': 8
    };
    const RANK_TO_STATUS = {
      1: 'ORDER PLACED',
      2: 'VEHICLE_ALLOTTED',
      3: 'DISPATCHED',
      4: 'DELIVERED',
      5: 'OUT_FOR_DELIVERY',
      6: 'DELIVERED_TO_VESSEL',
      7: 'CHALLAN_RECEIVED',
      8: 'CLOSED'
    };

    const groupValues = Object.values(groups);
    groupValues.forEach(group => {
      let minRank = Infinity;
      group.subShipments.forEach(s => {
        const st = s.currentStatus || s.status;
        const rank = STATUS_RANK[st?.toUpperCase()] || 1;
        if (rank < minRank) minRank = rank;
      });

      if (minRank !== Infinity) {
        group.status = RANK_TO_STATUS[minRank];
      }
    });

    return [...groupValues, ...singles].sort((a, b) => new Date(b.date) - new Date(a.date));
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
        onAdd={hasPermission('suppliers', 'create') ? () => setIsAddModalOpen(true) : undefined}
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
            navigate(`/supply/${item.id}`);
          }}
          onContact={(item) => {
            setContactModalDeal(item);
            setIsContactModalOpen(true);
          }}
          onAllot={hasPermission('suppliers', 'update') ? (item) => {
            setAllotModalDeal(item);
            setIsAllotModalOpen(true);
          } : undefined}
          onStatusUpdate={hasPermission('suppliers', 'update') ? handleStatusUpdate : undefined}
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
