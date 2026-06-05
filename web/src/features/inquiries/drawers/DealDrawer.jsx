import { DealDrawerSchema1, DealDrawerSchema2, DealDrawerSchema3 } from '@config/tableSchemas';
import React, { useState, useEffect } from "react";
import EmailPreviewModal from "../modals/EmailPreviewModal";
import MultiEmailPreviewModal from "../modals/MultiEmailPreviewModal";
import { calculateMargin, formatINR } from '@services/marginEngine';
import { CONFIG } from '@/config.js';
import { StatusBadge, DataTable, rowStripeClass, ROW_HOVER_CLS } from '@components/ui';

export default function DealDrawer({ deal, isOpen, onClose, onStatusUpdate, onAction, currentUser }) {
  const [activeTab, setActiveTab] = useState("RFQ");
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [localMyQuote, setLocalMyQuote] = useState(null); // Used to store calculated quote before sending
  const [isExpanded, setIsExpanded] = useState(true);

  const renderActionButton = () => {
    if (!onAction || !currentUser) return null;
    const role = currentUser.role || "Admin";
    const status = deal.status;

    const map = {
      PENDING: {
        label: "Check Stock",
        color: "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 dark:shadow-amber-500/10",
      },
      RFQ_READY: {
        label: "Create RFQ",
        color: "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10",
      },
      CLIENT_QUOTING: {
        label: "Quote Prices",
        color: "bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/20 dark:shadow-cyan-500/10",
      },
      TL_REVIEW: {
        label: "Set Margin",
        color: "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 dark:shadow-rose-500/10",
      },
      ADMIN_APPROVAL: {
        label: "Approve",
        color: "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 dark:shadow-orange-500/10",
      },
      EMPLOYEE_VERIFY: {
        label: "Verify & Quote",
        color: "bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20 dark:shadow-sky-500/10",
      },
      CLIENT_FINAL_APPROVAL: {
        label: "Final Decision",
        color: "bg-violet-500 hover:bg-violet-600 text-white shadow-lg shadow-violet-500/20 dark:shadow-violet-500/10",
      },
      QUOTE_SENT: {
        label: "Confirm Deal",
        color: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10",
      },
    };

    const cfg = map[status];
    if (!cfg) return null;

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

    const isAllowed = isRoleAllowed(status, role);
    if (!isAllowed) return null;

    return (
      <button
        onClick={() => {
          onAction(deal, status);
          onClose();
        }}
        className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold transition-all duration-200 active:scale-[0.98] ${cfg.color}`}
      >
        {cfg.label}
      </button>
    );
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isEmailModalOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isEmailModalOpen, onClose]);

  // Reset local state when deal changes
  useEffect(() => {
    if (deal) {
      setLocalMyQuote(deal.my_quote || null);
    }
  }, [deal]);

  // Auto-scroll the active workflow step into view when the drawer opens or deal status changes
  useEffect(() => {
    if (isOpen && deal) {
      const timer = setTimeout(() => {
        const activeEl = document.getElementById(
          `step-${deal.inquiry_id}-${deal.status}`,
        );
        if (activeEl) {
          activeEl.scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest",
          });
        }
      }, 350); // Matches the drawer's transition-transform duration
      return () => clearTimeout(timer);
    }
  }, [deal, isOpen]);

  if (!deal || !isOpen) return null;

  const formatCurrency = formatINR;

  const getWorkflowSteps = (status) => {
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

    const currentIdx = steps.findIndex((s) => s.id === status);

    return (
      <div
        className="overflow-x-auto w-full scrollbar-hide mt-4 mb-3 cursor-grab active:cursor-grabbing select-none"
        onWheel={(e) => {
          if (e.deltaY !== 0) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
        onMouseDown={(e) => {
          const ele = e.currentTarget;
          const startX = e.pageX - ele.offsetLeft;
          const scrollLeft = ele.scrollLeft;

          const handleMouseMove = (moveEvent) => {
            const x = moveEvent.pageX - ele.offsetLeft;
            const walk = (x - startX) * 1.5; // Drag scroll sensitivity
            ele.scrollLeft = scrollLeft - walk;
          };

          const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
          };

          document.addEventListener("mousemove", handleMouseMove);
          document.addEventListener("mouseup", handleMouseUp);
        }}
      >
        <div
          className="relative flex items-start pt-1 pb-2"
          style={{ width: `${steps.length * 80}px` }}
        >
          {/* Solid Continuous Background Track Line (masked behind solid circle backgrounds) */}
          <div
            className="absolute left-[40px] h-[2px] bg-gray-300 dark:bg-[#2a2d36] transition-colors duration-300 -z-10"
            style={{
              top: "12px",
              width: `${(steps.length - 1) * 80}px`,
            }}
          />

          {/* Solid Continuous Active Progress Line */}
          <div
            className="absolute left-[40px] h-[2px] bg-purple-500 transition-all duration-300 -z-10"
            style={{
              top: "12px",
              width: `${currentIdx * 80}px`,
            }}
          />

          {steps.map((step, idx) => {
            const isActive = idx <= currentIdx;
            const isCurrent = idx === currentIdx;
            return (
              <div
                key={step.id}
                id={`step-${deal.inquiry_id}-${step.id}`}
                className="flex flex-col items-center w-[80px] flex-shrink-0"
              >
                {/* Circle Container (exactly 16px high for 8px circle center) */}
                <div className="h-4 flex items-center justify-center">
                  <div
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 flex items-center justify-center bg-white dark:bg-[#1e2028] z-10
                      ${isActive
                        ? "border-purple-500 shadow-md shadow-purple-500/10"
                        : "border-gray-300 dark:border-gray-600"
                      }
                    `}
                  >
                    {isActive && (
                      <div
                        className={`w-1.5 h-1.5 rounded-full bg-purple-500
                          ${isCurrent ? "animate-pulse" : ""}
                        `}
                      />
                    )}
                  </div>
                </div>

                {/* Stepper Label */}
                <span
                  className={`text-[8px] mt-2 font-bold uppercase tracking-wider text-center max-w-[76px] leading-tight select-none transition-colors duration-300
                    ${isCurrent
                      ? "text-purple-400 font-extrabold"
                      : isActive
                        ? "text-purple-500/80"
                        : "text-gray-600 dark:text-gray-500"
                    }
                  `}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  let totalDealValue = 0;
  let totalCostValue = 0;

  const displayQuote = localMyQuote;

  if (deal && displayQuote && deal.seller_quote) {
    displayQuote.products.forEach((mqp, idx) => {
      totalDealValue += mqp.total_price || mqp.total_my_price; // total_my_price from marginEngine
      const sqp = deal.seller_quote.products[idx];
      const sqpQty = deal.products[idx].quantity;
      totalCostValue += sqp.seller_unit_price * sqpQty;
    });
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleCalculateQuote = () => {
    if (!deal || !deal.seller_quote) return;
    const settings = { default_margin_percent: CONFIG.defaultMargin || 50 };
    const calculated = calculateMargin(deal.seller_quote.products, settings);
    setLocalMyQuote(calculated);
    // Switch preview tab to QUOTE just so it's ready
    setActiveTab("QUOTE");
  };

  const currentDealWithLocalQuote = deal
    ? { ...deal, my_quote: displayQuote }
    : null;

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-[#f9fafb] dark:bg-[#0c0e12] transform transition-all duration-300 ease-in-out overflow-y-auto ${isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"}`}
      >
        <div className="w-full min-h-screen">
          {deal && (
            <div className="flex flex-col max-w-7xl mx-auto w-full py-8 px-4 sm:px-6 lg:px-8">
              
              {/* TOP HEADER NAVIGATION BAR */}
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2a2d36] pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-gray-50 dark:bg-[#1e2028] dark:hover:bg-[#242830] text-gray-700 dark:text-gray-300 font-bold text-xs uppercase tracking-wider border border-gray-200 dark:border-[#2a2d36] transition-all duration-200 shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Inquiries
                  </button>
                  <span className="text-gray-300 dark:text-[#2a2d36] font-light">|</span>
                  <span className="font-mono text-gray-500 dark:text-gray-400 text-lg font-bold tracking-wide">{deal.inquiry_id}</span>
                </div>
                <div className="flex items-center gap-3">
                  {renderActionButton()}
                  <StatusBadge status={deal.status} />
                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 transition-all duration-200 border border-red-500/20"
                    title="Close"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* PROGRESS BAR TIMELINE */}
              <div className="bg-white dark:bg-[#1e2028] rounded-xl p-5 mb-8 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
                <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">
                  Sourcing Milestone
                </div>
                {getWorkflowSteps(deal.status)}
              </div>

              {/* TWO COLUMN GRID LAYOUT */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT SIDE: Products and Quotations */}
                <div className="lg:col-span-2 space-y-8">
                  
                  {/* Products Requested */}
                  <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        Products Requested ({deal.products.length})
                      </div>
                      {deal.products.length > 4 && (
                        <button
                          onClick={() => setIsExpanded(!isExpanded)}
                          className="text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                        >
                          {isExpanded ? (
                            <>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                              </svg>
                              Show Less
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                              </svg>
                              Show All
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-[#2a2d36] bg-gray-50 dark:bg-[#242830]/30 shadow-inner">
                      <DataTable
                        columns={DealDrawerSchema1}
                        data={isExpanded ? deal.products : deal.products.slice(0, 4)}
                        emptyMessage="No products requested."
                        renderRow={(p, i) => (
                          <tr key={i} className={`${rowStripeClass(i)} ${ROW_HOVER_CLS}`}>
                            <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{(1 - 1) * 10 + i + 1}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                              {p.product_name}
                            </td>
                            <td className="px-4 py-3 font-mono font-medium">{p.quantity}</td>
                            <td className="px-4 py-3 text-gray-400">{p.unit}</td>
                            <td className="px-4 py-3 truncate max-w-[120px] text-gray-400 text-xs" title={p.specs}>
                              {p.specs}
                            </td>
                          </tr>
                        )}
                      />
                    </div>
                  </div>

                  {/* Seller Quote */}
                  <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
                    <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
                      Seller Quotation
                    </div>
                    {!deal.seller_quote ? (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4.5 flex items-start gap-3.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex flex-col">
                          <span className="text-amber-500 font-bold text-[14px]">Waiting for seller response</span>
                          <span className="text-amber-500/70 text-xs mt-1 font-medium">
                            RFQ was sent on {new Date(deal.date_received).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex flex-col mb-4 bg-gray-50 dark:bg-[#242830]/30 p-3 rounded-lg border border-gray-150 dark:border-[#2a2d36]">
                          <span className="text-gray-800 dark:text-gray-200 font-bold text-[14px]">{deal.seller_quote.seller_name}</span>
                          <span className="text-gray-500 text-xs mt-0.5">{deal.seller_quote.seller_email}</span>
                        </div>
                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-[#2a2d36] bg-gray-50 dark:bg-[#242830]/30 shadow-inner">
                          <DataTable
                            columns={DealDrawerSchema2}
                            data={deal.seller_quote.products || []}
                            emptyMessage="No products quoted."
                            renderRow={(p, i) => (
                              <tr key={i} className={`${rowStripeClass(i)} ${ROW_HOVER_CLS}`}>
                                <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{(1 - 1) * 10 + i + 1}</td>
                        <td className="px-4 py-3 truncate max-w-[120px] font-medium">{p.product_name}</td>
                                <td className="px-4 py-3 font-mono text-black dark:text-gray-200 font-medium">
                                  {formatCurrency(p.seller_unit_price)}
                                </td>
                                <td className="px-4 py-3 font-mono font-medium">{p.moq}</td>
                                <td className="px-4 py-3 text-[12px] font-medium text-gray-400">{p.lead_time}</td>
                              </tr>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* My Quotation */}
                  <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
                    <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
                      My Quote to Buyer
                    </div>

                    {!displayQuote && deal.seller_quote && (
                      <div className="mb-4">
                        <button
                          onClick={handleCalculateQuote}
                          className="w-full py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 font-bold border border-purple-500/50 rounded-lg transition-colors"
                        >
                          Calculate My Quote
                        </button>
                      </div>
                    )}

                    {!displayQuote && !deal.seller_quote && (
                      <div className="bg-gray-50 dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d36] border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-inner">
                        <span className="text-gray-400 text-[14px] font-semibold tracking-wide">Quote not prepared yet</span>
                      </div>
                    )}

                    {displayQuote && (
                      <div className="animate-fade-in">
                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-[#2a2d36] bg-gray-50 dark:bg-[#242830]/30 shadow-inner flex flex-col">
                          <DataTable
                            columns={DealDrawerSchema3}
                            data={displayQuote.products || []}
                            emptyMessage="No quote prepared."
                            renderRow={(p, i) => (
                              <tr key={i} className={`${rowStripeClass(i)} ${ROW_HOVER_CLS}`}>
                                <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{(1 - 1) * 10 + i + 1}</td>
                        <td className="px-4 py-3.5 truncate max-w-[120px] font-medium">{p.product_name}</td>
                                <td className="px-4 py-3.5 font-mono text-purple-300 font-bold">{formatCurrency(p.my_unit_price)}</td>
                                <td className="px-4 py-3.5 font-mono text-emerald-400 font-bold">{p.margin_percent || p.applied_margin_percent}%</td>
                                <td className="px-4 py-3.5 font-mono text-gray-900 dark:text-white text-right font-bold">
                                  {formatCurrency(p.total_price || p.total_my_price)}
                                </td>
                              </tr>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* RIGHT SIDE: Sourcing Details & Financial Summary */}
                <div className="space-y-8">
                  
                  {/* Sourcing Context Card */}
                  <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm">
                    <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
                      Sourcing Context
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-gray-400 font-medium">Customer / Client</div>
                        <div className="text-gray-900 dark:text-white text-base font-bold leading-tight mt-0.5">{deal.buyer_name}</div>
                        <div className="text-gray-400 text-xs mt-0.5">{deal.buyer_email}</div>
                      </div>

                      <div className="h-[1px] bg-gray-150 dark:bg-[#2a2d36] w-full" />

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-400 font-medium">Vessel Name</div>
                          <div className="text-gray-800 dark:text-gray-200 text-sm font-semibold mt-0.5">{deal.vessel_name || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 font-medium">Ref Number</div>
                          <div className="text-gray-800 dark:text-gray-200 text-sm font-mono mt-0.5">{deal.vessel_ref || "N/A"}</div>
                        </div>
                      </div>

                      <div className="h-[1px] bg-gray-150 dark:bg-[#2a2d36] w-full" />

                      <div>
                        <div className="text-xs text-gray-400 font-medium">Inquiry Date</div>
                        <div className="text-gray-800 dark:text-gray-200 text-sm font-medium mt-0.5">
                          {new Date(deal.date_received).toLocaleString("en-US", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>

                      {deal.remarks && (
                        <>
                          <div className="h-[1px] bg-gray-150 dark:bg-[#2a2d36] w-full" />
                          <div>
                            <div className="text-xs text-gray-400 font-medium">Remarks</div>
                            <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 leading-relaxed bg-gray-50 dark:bg-[#242830]/20 p-2.5 rounded-lg border border-gray-100 dark:border-[#2a2d36]">
                              {deal.remarks}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Financial Summary Card */}
                  {displayQuote && (
                    <div className="bg-white dark:bg-[#1e2028] rounded-xl p-6 border border-gray-200 dark:border-[#2a2d36] shadow-sm animate-fade-in">
                      <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
                        Financial Summary
                      </div>
                      
                      <div className="space-y-3.5">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 font-medium">Total Cost Value:</span>
                          <span className="font-mono text-gray-800 dark:text-gray-200 font-semibold">{formatCurrency(totalCostValue)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 font-medium">Total Deal Value:</span>
                          <span className="font-mono text-gray-900 dark:text-white font-bold">{formatCurrency(totalDealValue)}</span>
                        </div>

                        <div className="h-[1px] bg-gray-150 dark:bg-[#2a2d36] w-full" />
                        
                        <div className="flex justify-between items-center">
                          <span className="text-emerald-500/80 font-bold text-sm">Estimated Profit:</span>
                          <span className="font-mono text-emerald-400 font-extrabold text-base">{formatCurrency(totalDealValue - totalCostValue)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400 font-medium">Net Profit Margin:</span>
                          <span className="font-mono text-emerald-400 font-bold">
                            {((totalDealValue - totalCostValue) / totalDealValue * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </div>
          )}
        </div>
      </div>

      <EmailPreviewModal
        deal={currentDealWithLocalQuote}
        initialEmailType={activeTab}
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onStatusUpdate={onStatusUpdate}
      />
    </>
  );
}
