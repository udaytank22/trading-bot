import { useAuth, useUI, useData } from '@context';
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
  useMemo,
  useContext,
  useCallback,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import DealDrawer from './drawers/DealDrawer';
import EmailPreviewModal from './modals/EmailPreviewModal';
import { fetchInquiries, triggerRFQ } from '@services/n8nService';
import { formatDateString } from '@services/marginEngine';
import { useToast } from '@hooks/useToast';
import InquiryTable from './components/InquiryTable';
import InquiryKanban from './components/InquiryKanban';
import QuoteModal from './modals/QuoteModal';
import RFQModal from './modals/RFQModal';
import StockCheckModal from './modals/StockCheckModal';
import MultiEmailPreviewModal from './modals/MultiEmailPreviewModal';
import VerificationModal from './modals/VerificationModal';
import AdminApprovalModal from './modals/AdminApprovalModal';
import AddInquiryModal from './modals/AddInquiryModal';
import { Toast, PageToolbar, Pagination, Button } from '@components/ui';

function PlusIcon() {
  return (
    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
    </svg>
  );
}

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
          d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
        />
      </svg>
      <h3 className="text-white text-lg font-bold mb-1.5">
        No inquiries found
      </h3>
      <p className="text-gray-500 text-sm font-medium">
        Try changing your search or filter
      </p>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */
export default function InquiriesPage() {
  const location = useLocation();
  const { currentUser } = useAuth();
  const { inquiriesData, setInquiriesData, setSupplyData } = useData();
  const { toast, showToast } = useToast();

  // Filters & pagination
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(location.state?.filter ?? "All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [viewMode, setViewMode] = useState("kanban"); // 'table' | 'kanban'

  // Data loading
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState(new Date());
  const [now, setNow] = useState(new Date());

  const loadData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const data = await fetchInquiries();
        setInquiriesData(data ?? []);
      } finally {
        const t = new Date();
        setLastSynced(t);
        setNow(t);
        if (!silent) setLoading(false);
      }
    },
    [setInquiriesData],
  );

  useEffect(() => {
    loadData();
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
        setSelectedDeal(found);
        setIsDrawerOpen(true);
        // remove the openInquiryId from history state
        navigate(location.pathname, {
          replace: true,
          state: { filter: location.state?.filter },
        });
      }
    }
  }, [location.state, inquiriesData]);

  const syncLabel = useMemo(() => {
    const mins = Math.floor((now - lastSynced) / 60_000);
    return mins < 1 ? "Just now" : `${mins} min ago`;
  }, [now, lastSynced]);

  // Filtering
  const filteredInquiries = useMemo(() => {
    let result = inquiriesData.filter((inq) => {
      if (
        filter === "QUOTE_SENT_ONLY" &&
        !["QUOTE_SENT", "CLOSED"].includes(inq.status)
      )
        return false;
      if (
        filter === "PENDING_REPLIES" &&
        !["PENDING", "RFQ_SENT", "CLIENT_QUOTING"].includes(inq.status)
      )
        return false;
      if (
        !["All", "QUOTE_SENT_ONLY", "PENDING_REPLIES"].includes(filter) &&
        inq.status !== filter
      )
        return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const hit =
          inq.buyer_name.toLowerCase().includes(q) ||
          inq.buyer_email.toLowerCase().includes(q) ||
          (inq.vessel_name && inq.vessel_name.toLowerCase().includes(q)) ||
          (inq.vessel_ref && inq.vessel_ref.toLowerCase().includes(q)) ||
          inq.products.some((p) => p.product_name.toLowerCase().includes(q));
        if (!hit) return false;
      }
      return true;
    });

    // Sort by latest date first
    return result.sort(
      (a, b) => new Date(b.date_received) - new Date(a.date_received),
    );
  }, [inquiriesData, search, filter]);

  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInquiries.slice(start, start + itemsPerPage);
  }, [filteredInquiries, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(1);
  }, [totalPages, currentPage]);

  // Drawer / modal state
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [emailModalDeal, setEmailModalDeal] = useState(null);
  const [emailModalType, setEmailModalType] = useState("RFQ");
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteModalDeal, setQuoteModalDeal] = useState(null);

  // Step-by-step workflow state (null = show table, otherwise show full-page step view)
  const [activeStepView, setActiveStepView] = useState(null); // 'STOCK_CHECK', 'RFQ', 'QUOTE', 'VERIFY', 'ADMIN_APPROVAL'
  const [activeStepDeal, setActiveStepDeal] = useState(null);

  const [pendingRFQs, setPendingRFQs] = useState([]);
  const [isMultiEmailModalOpen, setIsMultiEmailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Inline action state
  const [inlineActionRow, setInlineActionRow] = useState(null);
  const [rowActionLoading, setRowActionLoading] = useState(false);

  const updateDealStatus = useCallback(
    (id, newStatus, extraData = {}) => {
      setInquiriesData((prev) =>
        prev.map((inq) =>
          inq.inquiry_id === id
            ? { ...inq, status: newStatus, ...extraData }
            : inq,
        ),
      );
      setSelectedDeal((prev) =>
        prev?.inquiry_id === id
          ? { ...prev, status: newStatus, ...extraData }
          : prev,
      );
    },
    [setInquiriesData],
  );

  const handleStockConfirm = (selectedSuppliers) => {
    if (activeStepDeal) {
      updateDealStatus(activeStepDeal.inquiry_id, "RFQ_READY", {
        selected_suppliers: selectedSuppliers,
      });
      setActiveStepView(null);
      showToast(
        `Selected ${selectedSuppliers.length} suppliers for RFQ.`,
        "success",
      );
    }
  };

  const handleVerifyConfirm = () => {
    if (activeStepDeal) {
      updateDealStatus(activeStepDeal.inquiry_id, "CLIENT_FINAL_APPROVAL");
      setActiveStepView(null);
      showToast("Quotation verified and sent to client.", "success");
    }
  };

  const handleAdminConfirm = (adjustedData) => {
    if (activeStepDeal) {
      updateDealStatus(activeStepDeal.inquiry_id, "EMPLOYEE_VERIFY", {
        admin_approved: true,
        margin_percent: adjustedData.margin_percent,
        discount_percent: adjustedData.discount_percent,
        my_quote: {
          products: adjustedData.products,
        },
      });
      setActiveStepView(null);
      showToast("Quotation approved by Admin.", "success");
    }
  };

  const handleAction = (deal, currentStatus) => {
    setActiveStepDeal(deal);
    switch (currentStatus) {
      case "PENDING":
        setActiveStepView("STOCK_CHECK");
        break;
      case "RFQ_READY":
        setActiveStepView("RFQ");
        break;
      case "CLIENT_QUOTING":
      case "TL_REVIEW":
        setActiveStepView("QUOTE");
        break;
      case "ADMIN_APPROVAL":
        setActiveStepView("ADMIN_APPROVAL");
        break;
      case "EMPLOYEE_VERIFY":
        setActiveStepView("VERIFY");
        break;
      case "CLIENT_FINAL_APPROVAL":
        // Simulated client decision using SweetAlert2
        Swal.fire({
          title: "Final Quotation Decision",
          text: `Do you want to accept the quotation for ${deal.inquiry_id}?`,
          icon: "question",
          showCancelButton: true,
          confirmButtonColor: "#8b5cf6",
          cancelButtonColor: "#ef4444",
          confirmButtonText: "Accept Quote",
          cancelButtonText: "Reject Quote",
          background: "#1a1d23",
          color: "#fff",
        }).then((result) => {
          if (result.isConfirmed) {
            updateDealStatus(deal.inquiry_id, "QUOTE_SENT");
            showToast("Client accepted the quote!", "success");
            Swal.fire({
              title: "Accepted!",
              text: "The deal has been moved to Supply.",
              icon: "success",
              background: "#1a1d23",
              color: "#fff",
            });
          } else if (result.dismiss === Swal.DismissReason.cancel) {
            updateDealStatus(deal.inquiry_id, "CLOSED");
            showToast("Client rejected the quote.", "error");
            Swal.fire({
              title: "Rejected",
              text: "The inquiry has been closed.",
              icon: "error",
              background: "#1a1d23",
              color: "#fff",
            });
          }
        });
        break;
      case "QUOTE_SENT":
        const newCargo = {
          inquiry_id: deal.inquiry_id,
          supplier: deal.seller_quote?.seller_name || "Assigned Supplier",
          buyer_name: deal.buyer_name,
          buyer_email: deal.buyer_email,
          cargo: deal.products[0]?.product_name || "Unknown Cargo",
          quantity: "See Details",
          destination: "TBD",
          status: "PENDING",
          products: deal.products,
        };
        setSupplyData((prev) => [...prev, newCargo]);
        updateDealStatus(deal.inquiry_id, "CONFIRMED");
        showToast("Deal confirmed and moved to Supply", "success");
        break;
      default:
        break;
    }
  };

  const handleQuoteSubmit = (quoteData) => {
    if (!activeStepDeal) return;

    if (activeStepDeal.status === "CLIENT_QUOTING") {
      updateDealStatus(activeStepDeal.inquiry_id, "TL_REVIEW", {
        seller_quote: {
          ...activeStepDeal.seller_quote,
          date_received: new Date().toISOString(),
          products: quoteData.products.map((p) => ({
            ...p,
            seller_unit_price: p.my_unit_price,
          })),
        },
      });
      setActiveStepView(null);
      showToast("Prices quoted. Sent to Team Lead for review.", "success");
    } else if (activeStepDeal.status === "TL_REVIEW") {
      const margin_percent = parseFloat(quoteData.margin) || 0;
      const discount_percent = parseFloat(quoteData.discount) || 0;

      const finalProducts = activeStepDeal.seller_quote.products.map((p) => {
        const cost = p.seller_unit_price || 0;
        let my_unit_price = cost;
        if (margin_percent > 0 || discount_percent > 0) {
          my_unit_price =
            cost * (1 + margin_percent / 100) * (1 - discount_percent / 100);
        }
        return {
          ...p,
          my_unit_price,
          margin_percent,
          discount_percent,
          total_price: my_unit_price * (p.quantity || 1),
        };
      });

      const extraData = {
        margin_percent,
        discount_percent,
        tl_approved: true,
        my_quote: {
          products: finalProducts,
        },
      };

      updateDealStatus(activeStepDeal.inquiry_id, "ADMIN_APPROVAL", extraData);
      setActiveStepView(null);
      showToast("Margin set. Sent for Admin approval.", "success");
    }
  };

  const handleRFQSubmit = (stagedRFQs) => {
    if (stagedRFQs.length > 0) {
      setPendingRFQs(stagedRFQs);
      setIsMultiEmailModalOpen(true);
    }
  };

  const handleMultiEmailClose = () => {
    setIsMultiEmailModalOpen(false);
    setActiveStepView(null);
  };

  const handleAddInquiry = (newInquiry) => {
    const tempInquiry = {
      ...newInquiry,
      inquiry_id: `INQ-${Date.now()}`,
      status: "PENDING",
      date_received: new Date().toISOString(),
      buyer_name: newInquiry.customer,
      buyer_email: "pending@example.com",
      products: newInquiry.products.map((p) => ({
        product_name: p.description,
        quantity: p.quantity,
        unit: p.unit,
      })),
    };
    setInquiriesData((prev) => [tempInquiry, ...prev]);
    showToast("New inquiry created successfully", "success");
  };

  if (loading) {
    return (
      <div className="flex flex-col w-full h-full pb-8 animate-pulse gap-4">
        <div className="flex items-center justify-between h-10">
          <div className="w-1/3 bg-[#242830] rounded-lg h-full opacity-40" />
          <div className="w-32 bg-[#242830] rounded-lg h-full opacity-40" />
        </div>
        <div className="flex-1 w-full bg-[#1a1d23] border border-[#2a2d33] rounded-xl opacity-40" />
      </div>
    );
  }

  // --- Step Views Rendering ---
  if (activeStepView) {
    return (
      <div className="w-full h-full bg-white dark:bg-[#0c0e12] animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto pb-10">
        <div className="max-w-6xl mx-auto py-8 px-4">
          {activeStepView === "STOCK_CHECK" && (
            <StockCheckModal
              isOpen={true}
              isPageMode={true}
              onClose={() => setActiveStepView(null)}
              onConfirm={handleStockConfirm}
              deal={activeStepDeal}
            />
          )}
          {activeStepView === "RFQ" && (
            <RFQModal
              isOpen={true}
              isPageMode={true}
              onClose={() => setActiveStepView(null)}
              onSubmit={handleRFQSubmit}
              deal={activeStepDeal}
            />
          )}
          {activeStepView === "QUOTE" && (
            <QuoteModal
              isOpen={true}
              isPageMode={true}
              onClose={() => setActiveStepView(null)}
              onSubmit={handleQuoteSubmit}
              deal={activeStepDeal}
            />
          )}
          {activeStepView === "VERIFY" && (
            <VerificationModal
              isOpen={true}
              isPageMode={true}
              onClose={() => setActiveStepView(null)}
              onConfirm={handleVerifyConfirm}
              deal={activeStepDeal}
            />
          )}
          {activeStepView === "ADMIN_APPROVAL" && (
            <AdminApprovalModal
              isOpen={true}
              isPageMode={true}
              onClose={() => setActiveStepView(null)}
              onConfirm={handleAdminConfirm}
              deal={activeStepDeal}
            />
          )}
        </div>

        <MultiEmailPreviewModal
          isOpen={isMultiEmailModalOpen}
          onClose={handleMultiEmailClose}
          stagedRFQs={pendingRFQs}
          inquiryDeal={activeStepDeal}
          onStatusUpdate={updateDealStatus}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full pb-4 relative overflow-hidden min-w-0">
      <Toast message={toast.message} type={toast.type} />

      {/* Centralized toolbar: search + status filter + Add Inquiry button */}
      <PageToolbar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search by buyer, vessel, ref..."
        filterValue={
          ["QUOTE_SENT_ONLY", "PENDING_REPLIES"].includes(filter)
            ? "All"
            : filter
        }
        onFilterChange={(val) => {
          setFilter(val);
          setCurrentPage(1);
        }}
        filterOptions={[
          { value: "All", label: "All Status" },
          { value: "PENDING", label: "Pending" },
          { value: "RFQ_SENT", label: "RFQ Sent" },
          { value: "QUOTE_SENT", label: "Quote Sent" },
          { value: "CLOSED", label: "Closed" },
        ]}
        rightSlot={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {/* Kanban View Button (Funnel) */}
              <button
                onClick={() => setViewMode("kanban")}
                title="Kanban view"
                className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-200 shadow-sm ${
                  viewMode === "kanban"
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
                className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-200 shadow-sm ${
                  viewMode === "table"
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
            <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
              <PlusIcon />
              Add Inquiry
            </Button>
          </div>
        }
      />

      {viewMode === "kanban" ? (
        /* ── Kanban board (no pagination — shows all filtered) ── */
        filteredInquiries.length > 0 ? (
          <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
            <InquiryKanban
              items={filteredInquiries}
              onView={(inq) => {
                setSelectedDeal(inq);
                setIsDrawerOpen(true);
              }}
              onAction={handleAction}
              onStatusChange={(id, newStatus) => updateDealStatus(id, newStatus)}
              currentUser={currentUser}
            />
          </div>
        ) : (
          <EmptyState />
        )
      ) : (
        /* ── Table view (with pagination) ── */
        <div className="flex-1 w-full bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl overflow-hidden flex flex-col shadow-lg transition-colors duration-300">
          {filteredInquiries.length > 0 ? (
            <InquiryTable
              items={currentItems}
              onView={(inq) => {
                setSelectedDeal(inq);
                setIsDrawerOpen(true);
              }}
              onAction={handleAction}
              currentUser={currentUser}
            />
          ) : (
            <EmptyState />
          )}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredInquiries.length}
            itemsPerPage={itemsPerPage}
            onPrev={() => setCurrentPage((p) => p - 1)}
            onNext={() => setCurrentPage((p) => p + 1)}
            onPageChange={(p) => setCurrentPage(p)}
            itemLabel="records"
          />
        </div>
      )}

      <DealDrawer
        deal={selectedDeal}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onStatusUpdate={updateDealStatus}
      />
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
