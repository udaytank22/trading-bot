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

import React, { useState, useEffect, useMemo, useContext, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { AppContext } from "../context";
import DealDrawer from "../components/DealDrawer";
import EmailPreviewModal from "../components/EmailPreviewModal";
import { fetchInquiries, triggerRFQ } from "../services/n8nService";
import { formatDateString } from "../services/marginEngine";
import { useToast } from "../hooks/useToast";
import InquiryTable from "../components/InquiryTable";
import QuoteModal from "../components/QuoteModal";
import RFQModal from "../components/RFQModal";
import MultiEmailPreviewModal from "../components/MultiEmailPreviewModal";
import AddInquiryModal from "../components/AddInquiryModal";
import { Toast, PageToolbar, Pagination } from "../components/ui";


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
  const { inquiriesData, setInquiriesData, setSupplyData } = useContext(AppContext);
  const { toast, showToast } = useToast();

  // Filters & pagination
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(location.state?.filter ?? "All");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

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
        !["PENDING", "RFQ_SENT"].includes(inq.status)
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
          inq.products.some((p) => p.product_name.toLowerCase().includes(q));
        if (!hit) return false;
      }
      return true;
    });

    // Sort by latest date first
    return result.sort((a, b) => new Date(b.date_received) - new Date(a.date_received));
  }, [inquiriesData, search, filter]);

  const totalPages = Math.ceil(filteredInquiries.length / ITEMS_PER_PAGE);
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInquiries.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInquiries, currentPage]);

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

  const [isRFQModalOpen, setIsRFQModalOpen] = useState(false);
  const [rfqModalDeal, setRfqModalDeal] = useState(null);

  const [pendingRFQs, setPendingRFQs] = useState([]);
  const [isMultiEmailModalOpen, setIsMultiEmailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Inline action state
  const [inlineActionRow, setInlineActionRow] = useState(null);
  const [rowActionLoading, setRowActionLoading] = useState(false);

  const updateDealStatus = useCallback(
    (id, newStatus) => {
      setInquiriesData((prev) =>
        prev.map((inq) =>
          inq.inquiry_id === id ? { ...inq, status: newStatus } : inq,
        ),
      );
      setSelectedDeal((prev) =>
        prev?.inquiry_id === id ? { ...prev, status: newStatus } : prev,
      );
    },
    [setInquiriesData],
  );

  const handleSendQuoteClick = (deal) => {
    if (deal.status === "PENDING") {
      setRfqModalDeal(deal);
      setIsRFQModalOpen(true);
    } else if (deal.status === "RFQ_RECEIVED") {
      setQuoteModalDeal(deal);
      setIsQuoteModalOpen(true);
    } else if (deal.status === "QUOTE_SENT") {
      // Confirm Deal & Move to Supply
      const newCargo = {
        inquiry_id: deal.inquiry_id,
        supplier: "Assigned Supplier", // This would normally come from the RFQ responses
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
    }
  };

  const handleQuoteSubmit = ({ discount, margin, narrative }) => {
    if (quoteModalDeal) {
      updateDealStatus(quoteModalDeal.inquiry_id, "QUOTE_SENT");
      showToast("Quote sent to buyer", "success");
    }
  };

  const handleRFQSubmit = (stagedRFQs) => {
    if (stagedRFQs.length > 0) {
      setPendingRFQs(stagedRFQs);
      setIsMultiEmailModalOpen(true);
    }
  };

  const handleAddInquiry = (newInquiry) => {
    // Generate a temporary ID
    const tempInquiry = {
      ...newInquiry,
      inquiry_id: `INQ-${Date.now()}`,
      status: "PENDING",
      date_received: new Date().toISOString(),
      buyer_name: newInquiry.customer,
      buyer_email: "pending@example.com", // Fallback
      products: newInquiry.products.map(p => ({
        product_name: p.description,
        quantity: p.quantity,
        unit: p.unit
      }))
    };
    
    setInquiriesData(prev => [tempInquiry, ...prev]);
    showToast("New inquiry created successfully", "success");
  };

  const startShowing =
    filteredInquiries.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endShowing = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredInquiries.length,
  );

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

  return (
    <div className="flex flex-col w-full h-full pb-8 relative">
      <Toast message={toast.message} type={toast.type} />

      {/* Centralized toolbar: search + status filter + Add Inquiry button */}
      <PageToolbar
        search={search}
        onSearchChange={(val) => { setSearch(val); setCurrentPage(1); }}
        searchPlaceholder="Search by buyer or product..."
        filterValue={[
          "QUOTE_SENT_ONLY", "PENDING_REPLIES",
        ].includes(filter) ? "All" : filter}
        onFilterChange={(val) => { setFilter(val); setCurrentPage(1); }}
        filterOptions={[
          { value: "All",        label: "All Status" },
          { value: "PENDING",    label: "Pending" },
          { value: "RFQ_SENT",   label: "RFQ Sent" },
          { value: "QUOTE_SENT", label: "Quote Sent" },
          { value: "CLOSED",     label: "Closed" },
        ]}
        onAdd={() => setIsAddModalOpen(true)}
        addLabel="Add Inquiry"
      />

      {/* Table */}
      <div className="flex-1 w-full bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl overflow-hidden flex flex-col shadow-lg transition-colors duration-300">
        {filteredInquiries.length > 0 ? (
          <InquiryTable
            items={currentItems}
            onView={(inq) => {
              setSelectedDeal(inq);
              setIsDrawerOpen(true);
            }}
            onSendQuote={handleSendQuoteClick}
          />
        ) : (
          <EmptyState />
        )}

        {/* Pagination */}
        {/* Centralized pagination footer */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredInquiries.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPrev={() => setCurrentPage((p) => p - 1)}
          onNext={() => setCurrentPage((p) => p + 1)}
          itemLabel="inquiries"
        />
      </div>

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
      <QuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        onSubmit={handleQuoteSubmit}
        deal={quoteModalDeal}
      />
      <RFQModal
        isOpen={isRFQModalOpen}
        onClose={() => setIsRFQModalOpen(false)}
        onSubmit={handleRFQSubmit}
        deal={rfqModalDeal}
      />
      <MultiEmailPreviewModal
        isOpen={isMultiEmailModalOpen}
        onClose={() => setIsMultiEmailModalOpen(false)}
        stagedRFQs={pendingRFQs}
        inquiryDeal={rfqModalDeal}
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
