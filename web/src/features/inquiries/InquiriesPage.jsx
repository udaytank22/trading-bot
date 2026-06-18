import { TOAST_MESSAGES } from '../../constants/toastMessages';
import { useAuth } from '@context';
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
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
    </svg>
  );
}



/* ── Main page ───────────────────────────────────────────────────── */
export default function InquiriesPage() {
  const location = useLocation();
  const { currentUser, hasPermission } = useAuth();
  const { toast, showToast } = useToast();

  // Filters & pagination
  const [search, setSearch] = useState("");
  const initialFilter = location.state?.filter;
  const initialFilterState = initialFilter && initialFilter !== "All" ? [initialFilter] : [];
  const [filter, setFilter] = useState(initialFilterState);
  const [clientFilter, setClientFilter] = useState([]);
  const [clients, setClients] = useState([]);
  const [viewMode, setViewMode] = useState("kanban"); // 'table' | 'kanban'

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

      {/* Centralized toolbar: search + status filter + Add Inquiry button */}
      <PageToolbar
        search={search}
        onSearchChange={(val) => setSearch(val)}
        searchPlaceholder="Search by buyer, vessel, ref..."
        filterValue={filter}
        onFilterChange={(val) => setFilter(val)}
        isMultiFilter={true}
        filterPlaceholder="All Status"
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
            placeholder="All Customers"
            className="min-w-[160px]"
          />
        }
        rightSlot={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {/* Kanban View Button (Funnel) */}
              <button
                onClick={() => setViewMode("kanban")}
                title="Kanban view"
                className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-200 shadow-sm ${viewMode === "kanban"
                  ? "bg-white dark:bg-[#1a1d23] border-purple-500 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20"
                  : "bg-white dark:bg-[#1a1d23] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M6 12h12m-9 5.25h6" />
                </svg>
              </button>

              {/* Table View Button (List) */}
              <button
                onClick={() => setViewMode("table")}
                title="Table view"
                className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-200 shadow-sm ${viewMode === "table"
                  ? "bg-white dark:bg-[#1a1d23] border-purple-500 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20"
                  : "bg-white dark:bg-[#1a1d23] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h12M3.75 12h9M3.75 17.25h6" />
                </svg>
              </button>
            </div>
            {hasPermission("inquiries", "create") && (
              <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
                <PlusIcon />
                Add Inquiry
              </Button>
            )}
          </div>
        }
      />

      {loading && filteredInquiries.length === 0 ? (
        <div className="flex-1 w-full bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl opacity-40 animate-pulse" />
      ) : viewMode === "kanban" ? (
        /* ── Kanban board (no pagination — shows all filtered) ── */
        filteredInquiries.length > 0 ? (
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
          <div className="flex-1 flex w-full">
            <EmptyState title="No inquiries found" description="Try changing your search or filter" />
          </div>
        )
      ) : (
        /* ── Table view (with pagination) ── */
        <div className="flex-1 w-full bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl overflow-hidden flex flex-col shadow-lg transition-colors duration-300">
          {filteredInquiries.length > 0 ? (
            <InquiryTable
              items={filteredInquiries}
              onView={onView}
              onAction={handleAction}
              currentUser={currentUser}
            />
          ) : (
            <EmptyState title="No inquiries found" description="Try changing your search or filter" />
          )}
          <Pagination
            currentPage={meta.currentPage}
            totalPages={meta.totalPages}
            totalItems={meta.totalItems}
            itemsPerPage={meta.pageSize}
            onPrev={() => handlePageChange(meta.currentPage - 1)}
            onNext={() => handlePageChange(meta.currentPage + 1)}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handlePageSizeChange}
            itemLabel="records"
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
