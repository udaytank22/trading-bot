import { TOAST_MESSAGES } from '../../constants/toastMessages';
import { useAuth } from '@context';
import { useSocket } from '@context';
/**
 * @file InquiriesPage.jsx
 * @description Customer Inquiries management page — list, filter, send RFQ/Quote, confirm deals.
 *
 * CENTRALIZED COMPONENTS USED:
 *   - PageToolbar → search + status filter + "Add Inquiry" button
 *   - Pagination  → Previous/Next with inquiry count
 *   - Toast       → success/error feedback
 *   - InquiryTable → table with View/Send RFQ/Send Quote/Confirm actions
 *
 * DATA FLOW:
 *   n8nService.fetchInquiries() → AppContext.inquiriesData → useMemo(filter) → paginate → InquiryTable
 *
 * @author TradeMind Dev Team
 */

import React, {
  useState,
  useEffect,

  useCallback,
  useRef,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { usePaginatedFetch } from '@hooks/usePaginatedFetch';

import EmailPreviewModal from './modals/EmailPreviewModal';
import { api } from '@services/api';
import { useToast } from '@hooks/useToast';
import InquiryTable from './components/InquiryTable';
import InquiryKanban from './components/InquiryKanban';
import AddInquiryModal from './modals/AddInquiryModal';
import { Toast, PageToolbar, Pagination, Button, EmptyState, Select } from '@components/ui';

function PlusIcon() {
  return (
    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}



/* ── Main page ───────────────────────────────────────────────────── */
export default function InquiriesPage() {
  const location = useLocation();
  const { currentUser, hasPermission } = useAuth();
  const { toast, showToast } = useToast();
  const { socket } = useSocket();

  // Real-time new inquiry alert state
  const [newInquiryAlert, setNewInquiryAlert] = useState(null);
  const alertTimerRef = useRef(null);
  const justCreatedByMeRef = useRef(false);

  // Filters & pagination
  const [search, setSearch] = useState("");
  const initialFilter = location.state?.filter;
  const initialFilterState = initialFilter && initialFilter !== "All" ? [initialFilter] : [];
  const [filter, setFilter] = useState(initialFilterState);
  const [clientFilter, setClientFilter] = useState([]);
  const [clients, setClients] = useState([]);
  const [viewMode, setViewMode] = useState(() => {
    return sessionStorage.getItem("inquiries_viewMode") || "kanban";
  }); // 'table' | 'kanban'

  useEffect(() => {
    sessionStorage.setItem("inquiries_viewMode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    api.clients.getClients({ paginate: 'false' })
      .then(res => setClients(res.data || []))
      .catch(console.error);
  }, []);

  const queryParams = React.useMemo(() => {
    const params = { search };
    if (filter && filter.length > 0) {
      params.statuses = filter.join(",");
    }
    if (clientFilter && clientFilter.length > 0) {
      params.clientIds = clientFilter.join(",");
    }
    return params;
  }, [search, filter, clientFilter]);

  const {
    data: inquiriesData,
    meta,
    loading,
    handlePageChange,
    handlePageSizeChange,
    refresh: loadData
  } = usePaginatedFetch(api.inquiries.getInquiries, 1, 30, queryParams);

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const poll = setInterval(() => loadData(true), 3 * 60 * 1000);
    const clock = setInterval(() => setNow(new Date()), 10_000);
    return () => {
      clearInterval(poll);
      clearInterval(clock);
    };
  }, [loadData]);

  // Real-time: listen for new_inquiry socket events
  useEffect(() => {
    if (!socket) return;

    const handleNewInquiry = (inquiry) => {
      // Prepend to the current list immediately
      loadData(true);

      // Skip the real-time popup if *this* user just created the inquiry
      if (justCreatedByMeRef.current) {
        justCreatedByMeRef.current = false;
        return;
      }

      // Show top-right popup
      setNewInquiryAlert(inquiry);
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
      alertTimerRef.current = setTimeout(() => setNewInquiryAlert(null), 5000);
    };

    socket.on('new_inquiry', handleNewInquiry);
    return () => {
      socket.off('new_inquiry', handleNewInquiry);
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    };
  }, [socket, loadData]);

  // If navigated here with an `openInquiryId` in location.state, open that inquiry
  const navigate = useNavigate();
  useEffect(() => {
    const idToOpen = location.state?.openInquiryId;
    if (idToOpen && inquiriesData && inquiriesData.length > 0) {
      const found = inquiriesData.find((i) => i.inquiry_id === idToOpen);
      if (found) {
        navigate(`/inquiries/${found.id}`, { replace: true });
      }
    }
  }, [location.state, inquiriesData, navigate]);

  // Filtering
  const filteredInquiries = inquiriesData || [];


  // Drawer / modal state
  const [emailModalDeal, setEmailModalDeal] = useState(null);
  const [emailModalType, setEmailModalType] = useState("RFQ");
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const updateDealStatus = useCallback(
    (id, newStatus, extraData = {}) => {
      loadData();
    },
    [loadData],
  );

  const onView = (inq) => {
    navigate(`/inquiries/${inq.id}`);
  };

  const handleAction = (inq, status) => {
    navigate(`/inquiries/${inq.id}`, { state: { activeTab: 'action' } });
  };

  const handleAddInquiry = async (newInquiry) => {
    try {
      const clientsRes = await api.clients.getClients();
      const client = clientsRes.data?.find(c => c.id === Number(newInquiry.customer) || c.name === newInquiry.customer);
      const clientId = client ? client.id : clientsRes.data?.[0]?.id;
      if (!clientId) {
        showToast(TOAST_MESSAGES.INQUIRIES.REQUIRE_CLIENT, "error");
        return;
      }

      const items = (newInquiry.products && newInquiry.products.length > 0)
        ? newInquiry.products.map((p) => ({
          description: p.product_name || p.description,
          quantity: parseInt(p.quantity, 10) || 1,
          unit: p.unit || "pcs"
        }))
        : [
          {
            description: "Flange Bolts (High Strength)",
            quantity: 5,
            unit: "Box"
          }
        ];

      // Flag so the socket handler won't show a duplicate popup
      justCreatedByMeRef.current = true;

      const res = await api.inquiries.createInquiry({
        clientId,
        vesselName: newInquiry.vessel,
        referenceNumber: newInquiry.vesselReference || `REF-${Date.now().toString().slice(-6)}`,
        items
      });

      if (res.success) {
        loadData(true);
        showToast(TOAST_MESSAGES.INQUIRIES.CREATED, "success");
      }
    } catch (err) {
      console.error(err);
      showToast(TOAST_MESSAGES.INQUIRIES.CREATE_ERROR, "error");
    }
  };



  return (
    <div className="flex flex-col w-full h-full pb-4 relative overflow-hidden min-w-0">
      <Toast message={toast.message} type={toast.type} />

      {/* ── Real-time new inquiry popup (top-right) ── */}
      <div
        style={{
          position: 'fixed',
          top: '1.25rem',
          right: '1.25rem',
          zIndex: 9999,
          transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          transform: newInquiryAlert ? 'translateX(0) scale(1)' : 'translateX(120%) scale(0.9)',
          opacity: newInquiryAlert ? 1 : 0,
          pointerEvents: newInquiryAlert ? 'auto' : 'none',
        }}
      >
        {newInquiryAlert && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
              border: '1px solid rgba(139,92,246,0.4)',
              borderRadius: '1rem',
              padding: '1rem 1.25rem',
              boxShadow: '0 8px 32px rgba(99,60,180,0.35), 0 2px 8px rgba(0,0,0,0.3)',
              minWidth: '300px',
              maxWidth: '360px',
            }}
          >
            {/* Icon */}
            <div style={{
              width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem',
              background: 'rgba(139,92,246,0.25)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#a78bfa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                New Inquiry
              </p>
              <p style={{ margin: '0.15rem 0 0.25rem', fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                {newInquiryAlert.inquiryNumber}
              </p>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#c4b5fd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {newInquiryAlert.client?.name || 'Unknown client'}
              </p>
              <button
                onClick={() => { navigate(`/inquiries/${newInquiryAlert.id}`); setNewInquiryAlert(null); }}
                style={{
                  marginTop: '0.5rem', fontSize: '0.72rem', color: '#7c3aed',
                  background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
                  borderRadius: '0.375rem', padding: '0.2rem 0.6rem', cursor: 'pointer',
                  fontWeight: 600, transition: 'background 0.2s',
                }}
              >
                View →
              </button>
            </div>

            {/* Close */}
            <button
              onClick={() => setNewInquiryAlert(null)}
              style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', padding: '0.1rem', lineHeight: 1, flexShrink: 0 }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Page Title Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-serif font-medium text-[#1e293b] dark:text-white tracking-tight">
          Inquiries
        </h1>
        <p className="text-sm font-sans font-medium text-[#64748b] dark:text-gray-400 mt-1">
          Track every request from datasheet to confirmed deal.
        </p>
      </div>


      {/* Centralized toolbar: search + status filter + Add Inquiry button */}
      <PageToolbar
        search={search}
        onSearchChange={(val) => setSearch(val)}
        searchPlaceholder="Search buyer, vessel, ref..."
        filterValue={filter}
        onFilterChange={(val) => setFilter(val)}
        isMultiFilter={true}
        filterPlaceholder="All status"
        filterOptions={[
          { value: "PENDING", label: "Datasheet" },
          { value: "RFQ_SENT", label: "RFQ sent" },
          { value: "QUOTE_SENT", label: "Quoted" },
          { value: "RFQ_RECEIVED", label: "RFQ Received" },
          { value: "CLIENT_QUOTING", label: "Client Quoting" },
          { value: "TL_REVIEW", label: "TL Review" },
          { value: "ADMIN_APPROVAL", label: "Admin Approval" },
          { value: "EMPLOYEE_VERIFY", label: "Employee Verify" },
          { value: "CLIENT_FINAL_APPROVAL", label: "Client Final Approval" },
          { value: "CONFIRMED", label: "Confirmed" },
          { value: "CLOSED", label: "Closed" },
        ]}
        extraFilters={
          <Select
            value={clientFilter}
            onChange={(val) => setClientFilter(val)}
            options={clients.map(c => ({ value: c.id, label: c.name }))}
            isMulti={true}
            placeholder="All customers"
            className="min-w-[160px]"
          />
        }
        rightSlot={
          <div className="flex items-center gap-3">
            {/* Board / Table Pill Switcher */}
            <div className="flex items-center gap-1 bg-[#e6e0d2]/60 dark:bg-[#1f222b] p-1 rounded-xl border border-[#e6e0d2] dark:border-[#2a2d33]">
              <button
                onClick={() => setViewMode("kanban")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === "kanban"
                    ? "bg-[#0a1628] text-white shadow-sm"
                    : "text-[#64748b] dark:text-gray-400 hover:text-[#1e293b]"
                  }`}
              >
                Board
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === "table"
                    ? "bg-[#0a1628] text-white shadow-sm"
                    : "text-[#64748b] dark:text-gray-400 hover:text-[#1e293b]"
                  }`}
              >
                Table
              </button>
            </div>

            {/* Add Inquiry Button using centralized Button component */}
            {hasPermission("inquiries", "create") && (
              <Button
                variant="primary"
                onClick={() => setIsAddModalOpen(true)}
              >
                + Add inquiry
              </Button>
            )}
          </div>
        }
      />

      {loading && filteredInquiries.length === 0 ? (
        <div className="flex-1 w-full bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl opacity-40 animate-pulse" />
      ) : viewMode === "kanban" ? (
        /* ── Kanban board (shows all columns, with empty column message when empty) ── */
        <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
          <InquiryKanban
            items={filteredInquiries}
            onView={onView}
            onAction={handleAction}
            onStatusChange={(id, newStatus) => updateDealStatus(id, newStatus)}
            currentUser={currentUser}
          />
        </div>
      ) : (
        /* ── Table view (with pagination) ── */
        <div className="flex-1 w-full bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl overflow-hidden flex flex-col shadow-lg transition-colors duration-300">
          <InquiryTable
            items={filteredInquiries}
            onView={onView}
            onAction={handleAction}
            currentUser={currentUser}
            paginationProps={{
              currentPage: meta.currentPage,
              totalPages: meta.totalPages,
              totalItems: meta.totalItems,
              itemsPerPage: meta.pageSize,
              onPrev: () => handlePageChange(meta.currentPage - 1),
              onNext: () => handlePageChange(meta.currentPage + 1),
              onPageChange: handlePageChange,
              onItemsPerPageChange: handlePageSizeChange,
              itemLabel: "records"
            }}
          />
        </div>
      )}

      <EmailPreviewModal
        deal={emailModalDeal}
        initialEmailType={emailModalType}
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onStatusUpdate={updateDealStatus}
      />
      <AddInquiryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddInquiry}
      />
    </div>
  );
}
