import { InquiryDetailsPageSchema1, InquiryDetailsPageSchema2, InquiryDetailsPageSchema3 } from '@config/tableSchemas';
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useData, useAuth } from '@context';
import { api } from '@services/api';
import { calculateMargin, formatINR } from '@services/marginEngine';
import { CONFIG } from '@/config.js';
import { StatusBadge, DataTable, rowStripeClass, ROW_HOVER_CLS } from '@components/ui';
import Swal from 'sweetalert2';

// Import action step views
import StockCheckModal from './modals/StockCheckModal';
import RFQModal from './modals/RFQModal';
import QuoteModal from './modals/QuoteModal';
import VerificationModal from './modals/VerificationModal';
import AdminApprovalModal from './modals/AdminApprovalModal';
import MultiEmailPreviewModal from './modals/MultiEmailPreviewModal';

export default function InquiryDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { inquiriesData, refreshAll } = useData();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'action'
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [localMyQuote, setLocalMyQuote] = useState(null);

  // RFQ state
  const [pendingRFQs, setPendingRFQs] = useState([]);
  const [isMultiEmailModalOpen, setIsMultiEmailModalOpen] = useState(false);

  useEffect(() => {
    const found = inquiriesData.find(inq => inq.id === id || inq.inquiry_id === id);
    if (found) {
      setDeal(found);
      setLocalMyQuote(found.my_quote || null);
    } else {
      setLoading(true);
      api.inquiries.getInquiry(id).then(res => {
        if (res.success && res.data) {
          setDeal(res.data);
          setLocalMyQuote(res.data.my_quote || null);
        }
      }).catch(err => {
        console.error('Failed to fetch inquiry:', err);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [id, inquiriesData]);

  // Set default tab if passed in location.state
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const confirmAction = async (title, text = "This process cannot be reverted.") => {
    const result = await Swal.fire({
      title,
      text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#8b5cf6",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Yes, proceed",
      cancelButtonText: "Cancel",
      background: "#1a1d23",
      color: "#fff"
    });
    return result.isConfirmed;
  };

  const handleStockConfirm = async (selectedSuppliers) => {
    const confirmed = await confirmAction(
      "Confirm Stock Check",
      "Are you sure you want to proceed with this stock check? This process cannot be reverted."
    );
    if (!confirmed) return;
    try {
      const supplierIds = selectedSuppliers.map(s => s.id);
      const res = await api.inquiries.stockCheck(deal.id, supplierIds);
      if (res.success) {
        refreshAll();
        setActiveTab("overview");
        Swal.fire({ icon: 'success', title: 'Stock Check Recorded', text: 'Suppliers linked successfully.', background: '#1a1d23', color: '#fff', showConfirmButton: false, timer: 1500 });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to record stock check.', background: '#1a1d23', color: '#fff' });
    }
  };

  const handleVerifyConfirm = async () => {
    const confirmed = await confirmAction(
      "Confirm Verification",
      "Are you sure you want to verify and dispatch the quotation to the client? This process cannot be reverted."
    );
    if (!confirmed) return;
    try {
      const res = await api.inquiries.finalVerify(deal.id);
      if (res.success) {
        refreshAll();
        setActiveTab("overview");
        Swal.fire({ icon: 'success', title: 'Verified', text: 'Quotation verified and sent to client.', background: '#1a1d23', color: '#fff', showConfirmButton: false, timer: 1500 });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to verify quotation.', background: '#1a1d23', color: '#fff' });
    }
  };

  const handleAdminConfirm = async (adjustedData) => {
    const confirmed = await confirmAction(
      "Confirm Admin Approval",
      "Are you sure you want to approve this pricing layout? This process cannot be reverted."
    );
    if (!confirmed) return;
    try {
      const marginVal = parseFloat(adjustedData.margin_percent) || 0;
      const discountVal = parseFloat(adjustedData.discount_percent) || 0;
      const totalAmount = adjustedData.products.reduce((sum, p) => sum + (p.total_price || 0), 0);
      const finalAmount = totalAmount * 1.18; // 18% tax

      const items = adjustedData.products.map(p => {
        const origItem = deal.items?.find(item => item.description === p.product_name) || {};
        return {
          inquiryItemId: origItem.id || p.inquiryItemId,
          sellingPrice: p.my_unit_price,
          quantity: p.quantity,
          totalPrice: p.total_price
        };
      });

      const res = await api.inquiries.adminApprove(deal.id, {
        approved: true,
        remarks: "Approved by Admin",
        overrideQuote: {
          marginPercentage: marginVal,
          discountPercentage: discountVal,
          totalAmount,
          finalAmount,
          items
        }
      });
      if (res.success) {
        refreshAll();
        setActiveTab("overview");
        Swal.fire({ icon: 'success', title: 'Approved', text: 'Quotation approved by Admin.', background: '#1a1d23', color: '#fff', showConfirmButton: false, timer: 1500 });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to record Admin approval.', background: '#1a1d23', color: '#fff' });
    }
  };

  const handleQuoteSubmit = async (quoteData) => {
    try {
      if (deal.status === "CLIENT_QUOTING") {
        const confirmed = await confirmAction(
          "Submit Client Quote",
          "Are you sure you want to submit these prices? This process cannot be reverted."
        );
        if (!confirmed) return;

        const items = quoteData.products.map(p => {
          const origItem = deal.items?.find(item => item.description === p.product_name) || {};
          const unitPrice = parseFloat(p.my_unit_price) || 0;
          const qty = parseInt(p.quantity, 10) || 1;
          return {
            inquiryItemId: origItem.id,
            sellingPrice: unitPrice,
            quantity: qty,
            totalPrice: unitPrice * qty
          };
        });
        const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

        const res = await api.inquiries.clientQuote(deal.id, {
          marginPercentage: 0,
          taxPercentage: 18,
          totalAmount,
          finalAmount: totalAmount * 1.18,
          items
        });

        if (res.success) {
          refreshAll();
          setActiveTab("overview");
          Swal.fire({ icon: 'success', title: 'Submitted', text: 'Prices quoted. Sent to Team Lead for review.', background: '#1a1d23', color: '#fff', showConfirmButton: false, timer: 1500 });
        }
      } else if (deal.status === "TL_REVIEW") {
        const confirmed = await confirmAction(
          "Submit Team Lead Review",
          "Are you sure you want to approve this margin structure? This process cannot be reverted."
        );
        if (!confirmed) return;

        const marginVal = parseFloat(quoteData.margin) || 0;
        const discountVal = parseFloat(quoteData.discount) || 0;

        let totalAmount = 0;
        const items = deal.products.map((p, idx) => {
          const sqp = deal.seller_quote?.products?.[idx];
          const cost = sqp?.seller_unit_price || 0;
          const qty = p.quantity || 1;
          const my_unit_price = cost * (1 + marginVal / 100) * (1 - discountVal / 100);
          const totalPrice = my_unit_price * qty;
          totalAmount += totalPrice;

          const origItem = deal.items?.find(item => item.description === p.product_name) || {};

          return {
            inquiryItemId: origItem.id,
            sellingPrice: my_unit_price,
            quantity: qty,
            totalPrice
          };
        });

        const finalAmount = totalAmount * 1.18; // 18% tax

        const res = await api.inquiries.teamLeadApprove(deal.id, {
          approved: true,
          remarks: quoteData.narrative || "Approved by Team Lead",
          overrideQuote: {
            marginPercentage: marginVal,
            discountPercentage: discountVal,
            totalAmount,
            finalAmount,
            items
          }
        });
        if (res.success) {
          refreshAll();
          setActiveTab("overview");
          Swal.fire({ icon: 'success', title: 'Submitted', text: 'Margin approved. Sent for Admin approval.', background: '#1a1d23', color: '#fff', showConfirmButton: false, timer: 1500 });
        }
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to submit quote.', background: '#1a1d23', color: '#fff' });
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
    refreshAll();
    setActiveTab("overview");
  };

  const triggerClientDecision = () => {
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
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await api.inquiries.clientDecision(deal.id, true);
        if (res.success) {
          refreshAll();
          setActiveTab("overview");
          Swal.fire({ icon: 'success', title: 'Accepted', text: 'Deal approved.', background: '#1a1d23', color: '#fff', showConfirmButton: false, timer: 1500 });
        }
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        const res = await api.inquiries.clientDecision(deal.id, false);
        if (res.success) {
          refreshAll();
          setActiveTab("overview");
          Swal.fire({ icon: 'warning', title: 'Rejected', text: 'Deal rejected and closed.', background: '#1a1d23', color: '#fff' });
        }
      }
    });
  };

  const triggerConfirmDeal = async () => {
    const confirmed = await confirmAction(
      "Confirm Deal",
      "Are you sure you want to confirm this deal and move it to Supply? This process cannot be reverted."
    );
    if (!confirmed) return;
    try {
      const res = await api.inquiries.confirmDeal(deal.id);
      if (res.success) {
        refreshAll();
        setActiveTab("overview");
        Swal.fire({ icon: 'success', title: 'Deal Confirmed', text: 'Deal moved to Supply.', background: '#1a1d23', color: '#fff', showConfirmButton: false, timer: 1500 });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to confirm deal.', background: '#1a1d23', color: '#fff' });
    }
  };

  const isRoleAllowed = (status, roleName) => {
    const rNameLower = roleName?.toLowerCase();
    if (rNameLower === "admin" || rNameLower === "super admin" || rNameLower === "administrator") return true;
    if (rNameLower === "viewer") return false;

    switch (status) {
      case "PENDING":
      case "RFQ_READY":
      case "EMPLOYEE_VERIFY":
      case "QUOTE_SENT":
        return rNameLower === "employee" || rNameLower === "team lead";
      case "TL_REVIEW":
        return rNameLower === "team lead";
      case "CLIENT_QUOTING":
      case "CLIENT_FINAL_APPROVAL":
        return rNameLower === "client";
      case "ADMIN_APPROVAL":
        return false;
      default:
        return false;
    }
  };

  const canPerformAction = useMemo(() => {
    if (!deal || !currentUser) return false;
    return isRoleAllowed(deal.status, currentUser.role);
  }, [deal, currentUser]);

  const actionConfig = useMemo(() => {
    if (!deal) return null;
    const map = {
      PENDING: { label: "Check Stock", tabLabel: "Stock Check" },
      RFQ_READY: { label: "Create RFQ", tabLabel: "Prepare RFQ" },
      CLIENT_QUOTING: { label: "Quote Prices", tabLabel: "Build Quote" },
      TL_REVIEW: { label: "Set Margin", tabLabel: "Review Margin" },
      ADMIN_APPROVAL: { label: "Approve pricing", tabLabel: "Admin Approval" },
      EMPLOYEE_VERIFY: { label: "Verify & Quote", tabLabel: "Final Verification" },
      CLIENT_FINAL_APPROVAL: { label: "Final Decision", tabLabel: "Client Decision" },
      QUOTE_SENT: { label: "Confirm Deal", tabLabel: "Confirm Deal" },
    };
    return map[deal.status] || null;
  }, [deal]);

  const handleCalculateQuote = () => {
    if (!deal || !deal.seller_quote) return;
    const settings = { default_margin_percent: CONFIG.defaultMargin || 50 };
    const calculated = calculateMargin(deal.seller_quote.products, settings);
    setLocalMyQuote(calculated);
  };

  if (loading || !deal) {
    return (
      <div className="flex flex-col w-full h-full p-8 animate-pulse gap-6">
        <div className="flex items-center justify-between h-10">
          <div className="w-1/3 bg-gray-255 dark:bg-[#242830] rounded-lg h-full opacity-40" />
          <div className="w-32 bg-gray-255 dark:bg-[#242830] rounded-lg h-full opacity-40" />
        </div>
        <div className="h-40 bg-gray-255 dark:bg-[#1a1d23] border border-gray-300 dark:border-[#2a2d33] rounded-xl opacity-40" />
        <div className="flex-1 w-full bg-gray-255 dark:bg-[#1a1d23] border border-gray-350 dark:border-[#2a2d33] rounded-xl opacity-40" />
      </div>
    );
  }

  const steps = [
    { id: "PENDING", label: "Created" },
    { id: "RFQ_READY", label: "Stock Checked" },
    { id: "RFQ_SENT", label: "RFQ Sent" },
    { id: "TL_REVIEW", label: "TL Review" },
    { id: "ADMIN_APPROVAL", label: "Admin Approval" },
    { id: "EMPLOYEE_VERIFY", label: "Employee Verify" },
    { id: "CLIENT_FINAL_APPROVAL", label: "Final Approval" },
    { id: "QUOTE_SENT", label: "Quoted" },
    { id: "CONFIRMED", label: "Confirmed" },
  ];
  const currentStepIdx = steps.findIndex(s => s.id === deal.status);

  // Financial summary calculations
  let totalDealValue = 0;
  let totalCostValue = 0;
  const displayQuote = localMyQuote;

  if (deal && displayQuote && deal.seller_quote) {
    displayQuote.products.forEach((mqp, idx) => {
      totalDealValue += mqp.total_price || mqp.total_my_price;
      const sqp = deal.seller_quote.products[idx];
      const sqpQty = deal.products[idx]?.quantity || 1;
      if (sqp) {
        totalCostValue += sqp.seller_unit_price * sqpQty;
      }
    });
  }

  const currentDealWithLocalQuote = { ...deal, my_quote: displayQuote };

  return (
    <div className="w-full animate-in fade-in duration-300 pb-6">
      <div className="max-w-7xl mx-auto py-2 px-2 md:px-4 flex flex-col gap-4">

        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-[#2a2d36] pb-4 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/inquiries')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 dark:bg-[#1e2028] dark:hover:bg-[#242830] text-gray-700 dark:text-gray-300 font-bold text-xs uppercase tracking-wider border border-gray-200 dark:border-[#2a2d36] transition-all duration-200 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Inquiries
            </button>
            <span className="text-gray-300 dark:text-[#2a2d36] font-light">|</span>
            <span className="font-mono text-gray-950 dark:text-white text-lg font-bold tracking-wide">{deal.inquiry_id}</span>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={deal.status} />
            {canPerformAction && actionConfig && (
              <button
                onClick={() => setActiveTab(activeTab === 'action' ? 'overview' : 'action')}
                className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold transition-all duration-205 active:scale-[0.98] shadow-sm ${activeTab === 'action'
                    ? 'bg-gray-200 hover:bg-gray-350 text-gray-800 dark:bg-[#1a1d23] dark:hover:bg-[#242830] dark:text-gray-300 border border-gray-300 dark:border-[#2a2d36]'
                    : 'bg-purple-600 hover:bg-purple-550 text-white shadow-purple-600/10'
                  }`}
              >
                {activeTab === 'action' ? 'Show Details' : actionConfig.label}
              </button>
            )}
          </div>
        </div>

        {/* STEPPER TIMELINE */}
        {/* <div className="bg-white dark:bg-[#1e2028] rounded-xl p-5 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
          <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 px-1">
            Sourcing Milestone Progress
          </div>
          <div className="overflow-x-auto w-full custom-scrollbar pb-1">
            <div className="relative flex items-start pt-1 pb-2 min-w-[720px]">
              <div
                className="absolute left-[40px] h-[2px] bg-gray-200 dark:bg-[#2a2d36] -z-10"
                style={{ top: "12px", width: `${(steps.length - 1) * 80}px` }}
              />
              <div
                className="absolute left-[40px] h-[2px] bg-purple-500 -z-10 transition-all duration-350"
                style={{ top: "12px", width: `${currentStepIdx * 80}px` }}
              />
              {steps.map((step, idx) => {
                const isActive = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <div key={step.id} className="flex flex-col items-center w-[80px] flex-shrink-0">
                    <div className="h-4 flex items-center justify-center">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 bg-white dark:bg-[#1e2028] z-10 transition-all duration-300 flex items-center justify-center
                        ${isActive ? "border-purple-500 shadow" : "border-gray-300 dark:border-gray-600"}`}>
                        {isActive && <div className={`w-1.5 h-1.5 rounded-full bg-purple-500 ${isCurrent ? "animate-pulse" : ""}`} />}
                      </div>
                    </div>
                    <span className={`text-[8px] mt-2 font-bold uppercase tracking-wider text-center max-w-[76px] leading-tight select-none
                      ${isCurrent ? "text-purple-500 font-extrabold" : isActive ? "text-purple-550/80 dark:text-purple-400/80" : "text-gray-500"}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div> */}

        {/* TABS SELECTOR */}
        {canPerformAction && actionConfig && (
          <div className="flex border-b border-gray-200 dark:border-[#2a2d36]">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-2.5 font-bold text-sm border-b-2 transition-all duration-200 ${activeTab === 'overview'
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('action')}
              className={`px-6 py-2.5 font-bold text-sm border-b-2 transition-all duration-200 ${activeTab === 'action'
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              {actionConfig.tabLabel}
            </button>
          </div>
        )}

        {/* DETAILS OVERVIEW VIEW */}
        {activeTab === 'overview' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT SIDE: Products & Quotes */}
            <div className="lg:col-span-2 space-y-6">

              {/* Products Requested */}
              <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Products Requested</h3>
                  {deal.products.length > 4 && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="text-[10px] font-bold text-purple-500 hover:text-purple-400 transition-colors"
                    >
                      {isExpanded ? "Show Less" : "Show All"}
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-250 dark:border-[#2a2d36] bg-gray-50/50 dark:bg-[#242830]/30 shadow-inner">
                  <DataTable
                    columns={InquiryDetailsPageSchema1}
                    data={isExpanded ? deal.products : deal.products.slice(0, 4)}
                    emptyMessage="No products requested."
                    renderRow={(p, i) => (
                      <tr key={i} className={`${rowStripeClass(i)} ${ROW_HOVER_CLS}`}>
                        <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{(1 - 1) * 10 + i + 1}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-bold">{p.product_name}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-gray-200/50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-bold rounded">
                            {p.category || 'General'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-medium">{p.quantity}</td>
                        <td className="px-4 py-3 text-gray-450 font-medium">{p.unit}</td>
                      </tr>
                    )}
                  />
                </div>
              </div>

              {/* Seller Quote */}
              <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Seller Quotation</h3>
                {!deal.seller_quote ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4.5 flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-550 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex flex-col">
                      <span className="text-amber-650 dark:text-amber-500 font-bold text-sm">Awaiting supplier response</span>
                      <span className="text-gray-400 text-xs mt-1">RFQ was dispatched to potential suppliers.</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex flex-col mb-4 bg-gray-50 dark:bg-[#242830]/30 p-3.5 rounded-xl border border-gray-250 dark:border-[#2a2d36]">
                      <span className="text-gray-900 dark:text-white font-bold text-sm">{deal.seller_quote.seller_name}</span>
                      <span className="text-gray-500 text-xs mt-0.5">{deal.seller_quote.seller_email}</span>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#2a2d36] bg-gray-50/50 dark:bg-[#242830]/30 shadow-inner">
                      <DataTable
                        columns={InquiryDetailsPageSchema2}
                        data={deal.seller_quote.products || []}
                        emptyMessage="No quote details."
                        renderRow={(p, i) => (
                          <tr key={i} className={`${rowStripeClass(i)} ${ROW_HOVER_CLS}`}>
                            <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{(1 - 1) * 10 + i + 1}</td>
                            <td className="px-4 py-3 font-semibold">{p.product_name}</td>
                            <td className="px-4 py-3 font-mono text-gray-900 dark:text-white font-bold">{formatINR(p.seller_unit_price)}</td>
                            <td className="px-4 py-3 font-mono font-medium">{p.moq}</td>
                            <td className="px-4 py-3 text-xs text-gray-450 font-medium">{p.lead_time}</td>
                          </tr>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Client Quote */}
              <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Quotation Built for Buyer</h3>
                {!displayQuote ? (
                  deal.seller_quote ? (
                    <button
                      onClick={handleCalculateQuote}
                      className="w-full py-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-650 dark:text-purple-400 font-bold border border-purple-500/30 rounded-xl transition-all"
                    >
                      Calculate Quotation Layout
                    </button>
                  ) : (
                    <div className="text-center py-6 text-sm text-gray-400 italic bg-gray-50/50 dark:bg-[#1e2028]/50 rounded-xl border border-dashed border-gray-200 dark:border-[#2a2d36]">
                      Quote will be generated once supplier pricing is received.
                    </div>
                  )
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#2a2d36] bg-gray-50/50 dark:bg-[#242830]/30 shadow-inner">
                    <DataTable
                      columns={InquiryDetailsPageSchema3}
                      data={displayQuote.products || []}
                      emptyMessage="No quote prepared."
                      renderRow={(p, i) => (
                        <tr key={i} className={`${rowStripeClass(i)} ${ROW_HOVER_CLS}`}>
                          <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{(1 - 1) * 10 + i + 1}</td>
                          <td className="px-4 py-3 font-semibold">{p.product_name}</td>
                          <td className="px-4 py-3 font-mono text-purple-600 dark:text-purple-400 font-bold">{formatINR(p.my_unit_price)}</td>
                          <td className="px-4 py-3 font-mono text-emerald-500 font-semibold">{p.margin_percent || p.applied_margin_percent}%</td>
                          <td className="px-4 py-3 font-mono text-gray-900 dark:text-white text-right font-extrabold">{formatINR(p.total_price || p.total_my_price)}</td>
                        </tr>
                      )}
                    />
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT SIDE: Context & Financial Summary */}
            <div className="space-y-6">

              {/* Context Card */}
              <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Sourcing Context</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Customer Name</span>
                    <span className="text-gray-900 dark:text-white font-bold text-sm mt-0.5 block">{deal.buyer_name}</span>
                    <span className="text-gray-550 text-xs block">{deal.buyer_email}</span>
                  </div>
                  <div className="border-t border-gray-100 dark:border-[#2a2d36]/80 pt-3.5">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Vessel Details</span>
                    <span className="text-gray-800 dark:text-gray-200 font-semibold text-sm mt-0.5 block">{deal.vessel_name || "—"}</span>
                    <span className="text-gray-500 font-mono text-xs block mt-0.5">Ref: {deal.vessel_ref || "—"}</span>
                  </div>
                  <div className="border-t border-gray-100 dark:border-[#2a2d36]/80 pt-3.5">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Created On</span>
                    <span className="text-gray-700 dark:text-gray-300 text-xs font-medium block mt-0.5">
                      {new Date(deal.date_received).toLocaleString()}
                    </span>
                  </div>
                  {deal.remarks && (
                    <div className="border-t border-gray-100 dark:border-[#2a2d36]/80 pt-3.5">
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Special Remarks</span>
                      <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 bg-gray-50 dark:bg-gray-950/20 p-3 rounded-lg border border-gray-200 dark:border-[#2a2d36] leading-relaxed">
                        {deal.remarks}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Financials Card */}
              {displayQuote && (
                <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm animate-fade-in">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Financial Summary</h3>
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-medium">Total Cost Price:</span>
                      <span className="font-mono text-gray-850 dark:text-gray-250 font-bold">{formatINR(totalCostValue)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-medium">Total Selling Price:</span>
                      <span className="font-mono text-purple-650 dark:text-purple-400 font-extrabold">{formatINR(totalDealValue)}</span>
                    </div>
                    <div className="border-t border-gray-100 dark:border-[#2a2d36] pt-3.5">
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-500 font-bold text-sm">Gross Profit:</span>
                        <span className="font-mono text-emerald-500 dark:text-emerald-400 font-extrabold text-base">{formatINR(totalDealValue - totalCostValue)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs mt-1">
                        <span className="text-gray-400 font-medium">Net Profit Margin:</span>
                        <span className="font-mono text-emerald-450 dark:text-emerald-400 font-bold">
                          {((totalDealValue - totalCostValue) / totalDealValue * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        ) : (
          /* ACTION STEP PANEL */
          <div className="bg-white dark:bg-[#1e2028] rounded-xl border border-gray-200 dark:border-[#2a2d36] p-6 shadow-sm min-h-[300px] animate-fade-in">
            {deal.status === "PENDING" && (
              <StockCheckModal
                isOpen={true}
                isPageMode={true}
                onClose={() => setActiveTab("overview")}
                onConfirm={handleStockConfirm}
                deal={deal}
              />
            )}
            {deal.status === "RFQ_READY" && (
              <RFQModal
                isOpen={true}
                isPageMode={true}
                onClose={() => setActiveTab("overview")}
                onSubmit={handleRFQSubmit}
                deal={deal}
              />
            )}
            {(deal.status === "CLIENT_QUOTING" || deal.status === "TL_REVIEW") && (
              <QuoteModal
                isOpen={true}
                isPageMode={true}
                onClose={() => setActiveTab("overview")}
                onSubmit={handleQuoteSubmit}
                deal={deal}
              />
            )}
            {deal.status === "EMPLOYEE_VERIFY" && (
              <VerificationModal
                isOpen={true}
                isPageMode={true}
                onClose={() => setActiveTab("overview")}
                onConfirm={handleVerifyConfirm}
                deal={deal}
              />
            )}
            {deal.status === "ADMIN_APPROVAL" && (
              <AdminApprovalModal
                isOpen={true}
                isPageMode={true}
                onClose={() => setActiveTab("overview")}
                onConfirm={handleAdminConfirm}
                deal={deal}
              />
            )}
            {deal.status === "CLIENT_FINAL_APPROVAL" && (
              <div className="flex flex-col items-center justify-center text-center p-8 gap-4 max-w-md mx-auto">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 text-purple-650 dark:text-purple-400 rounded-full flex items-center justify-center shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-gray-900 dark:text-white font-bold text-base">Final Buyer Decision</h4>
                <p className="text-gray-400 text-xs">The quotation has been dispatched to the client. Please record their final decision (Accept/Reject) to proceed.</p>
                <div className="flex gap-3 w-full mt-3">
                  <button
                    onClick={triggerClientDecision}
                    className="flex-1 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-purple-600/20 transition-all"
                  >
                    Record Decision
                  </button>
                </div>
              </div>
            )}
            {deal.status === "QUOTE_SENT" && (
              <div className="flex flex-col items-center justify-center text-center p-8 gap-4 max-w-md mx-auto">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-650 dark:text-emerald-450 rounded-full flex items-center justify-center shadow-inner">
                  <svg xmlns="http://www.w3.org/2500/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-gray-900 dark:text-white font-bold text-base">Confirm Deal & Initiate Supply</h4>
                <p className="text-gray-400 text-xs">The client has accepted the quotation. Confirming the deal will move it to the supply chain pipeline and auto-generate the Purchase Order (PO).</p>
                <div className="w-full mt-3">
                  <button
                    onClick={triggerConfirmDeal}
                    className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 transition-all"
                  >
                    Confirm Deal
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      <MultiEmailPreviewModal
        isOpen={isMultiEmailModalOpen}
        onClose={handleMultiEmailClose}
        stagedRFQs={pendingRFQs}
        inquiryDeal={currentDealWithLocalQuote}
        onStatusUpdate={() => { }}
      />
    </div>
  );
}
