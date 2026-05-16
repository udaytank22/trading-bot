import React, { useState, useEffect } from "react";
import EmailPreviewModal from "./EmailPreviewModal";
import { calculateMargin, formatINR } from "../services/marginEngine";
import { CONFIG } from "../config";
import { StatusBadge } from "./ui";

export default function DealDrawer({ deal, isOpen, onClose, onStatusUpdate }) {
  const [activeTab, setActiveTab] = useState("RFQ");
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [localMyQuote, setLocalMyQuote] = useState(null); // Used to store calculated quote before sending
  const [isExpanded, setIsExpanded] = useState(false);

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

  if (!deal || !isOpen) return null;

  const formatCurrency = formatINR;

  const getWorkflowSteps = (status) => {
    const steps = [
      { id: 'PENDING', label: 'Created' },
      { id: 'RFQ_READY', label: 'Stock Checked' },
      { id: 'CLIENT_QUOTING', label: 'Client Quoting' },
      { id: 'TL_REVIEW', label: 'TL Review' },
      { id: 'ADMIN_APPROVAL', label: 'Admin Approval' },
      { id: 'EMPLOYEE_VERIFY', label: 'Employee Verify' },
      { id: 'CLIENT_FINAL_APPROVAL', label: 'Final Approval' },
      { id: 'QUOTE_SENT', label: 'Quoted' },
      { id: 'CONFIRMED', label: 'Confirmed' },
    ];

    const currentIdx = steps.findIndex(s => s.id === status);
    
    return (
      <div className="flex items-center gap-1 mt-4 mb-2 overflow-x-auto pb-2 scrollbar-hide">
        {steps.map((step, idx) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center min-w-[70px]">
              <div className={`w-3 h-3 rounded-full border-2 ${idx <= currentIdx ? 'bg-purple-500 border-purple-500' : 'bg-transparent border-gray-600'}`} />
              <span className={`text-[8px] mt-1 font-bold uppercase ${idx <= currentIdx ? 'text-purple-400' : 'text-gray-600'}`}>{step.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`h-[1px] w-4 mt-[-14px] ${idx < currentIdx ? 'bg-purple-500' : 'bg-gray-600'}`} />
            )}
          </React.Fragment>
        ))}
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
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={handleBackdropClick}
      />

      <div
        className={`fixed top-0 right-0 h-full w-[500px] bg-white dark:bg-[#1e2028] border-l border-gray-200 dark:border-[#2a2d36] z-50 transform transition-transform duration-300 ease-in-out flex flex-col overflow-y-auto shadow-2xl ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {deal && (
          <div className="flex flex-col flex-1 h-fit">
            {/* SECTION 1: Deal Header */}
            <div className="p-6 relative">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div className="flex items-center justify-between mt-1 mb-3.5 pr-8">
                <div className="font-mono text-gray-400 text-lg tracking-wide">
                  {deal.inquiry_id}
                </div>
                <StatusBadge status={deal.status} />
              </div>
              <div className="text-gray-900 dark:text-white text-[20px] font-bold leading-tight tracking-wide">
                {deal.buyer_name}
              </div>
              <div className="text-gray-400 text-[14px] mt-1 tracking-wide">
                {deal.buyer_email}
              </div>
              
              {/* Workflow Visualization */}
              {getWorkflowSteps(deal.status)}

              <div className="text-gray-500 text-[13px] mt-1.5 font-medium">
                {new Date(deal.date_received).toLocaleString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </div>
            </div>

            <div className="h-[1px] bg-gray-200 dark:bg-[#2a2d36] w-full" />

            {/* SECTION 2: Products Requested */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
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
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-[#2a2d36] bg-gray-100 dark:bg-[#242830]/50 shadow-sm">
                <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                  <thead className="bg-gray-50 dark:bg-[#1a1d23] text-gray-400 text-[11px] font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2d36]">
                        Product
                      </th>
                      <th className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2d36]">
                        Qty
                      </th>
                      <th className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2d36]">
                        Unit
                      </th>
                      <th className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2d36]">
                        Specs
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-[#2a2d36]/50">
                    {(isExpanded ? deal.products : deal.products.slice(0, 4)).map((p, i) => (
                      <tr
                        key={i}
                        className="hover:bg-gray-50 dark:hover:bg-white/[0.03] bg-transparent dark:bg-white/[0.01]"
                      >
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                          {p.product_name}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium">
                          {p.quantity}
                        </td>
                        <td className="px-4 py-3 text-gray-400">{p.unit}</td>
                        <td
                          className="px-4 py-3 truncate max-w-[120px] text-gray-400 text-xs"
                          title={p.specs}
                        >
                          {p.specs}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="h-[1px] bg-gray-200 dark:bg-[#2a2d36] w-full" />

            {/* SECTION 3: Seller Quote */}
            <div className="p-6">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">
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
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-amber-500 font-bold text-[14px]">
                      Waiting for seller response
                    </span>
                    <span className="text-amber-500/70 text-xs mt-1 font-medium">
                      RFQ was sent on{" "}
                      {new Date(deal.date_received).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex flex-col mb-4">
                    <span className="text-gray-800 dark:text-gray-200 font-bold text-[14px]">
                      {deal.seller_quote.seller_name}
                    </span>
                    <span className="text-gray-500 text-xs mt-0.5">
                      {deal.seller_quote.seller_email}
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-[#2a2d36] bg-gray-100 dark:bg-[#242830]/50 shadow-sm">
                    <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                      <thead className="bg-gray-50 dark:bg-[#1a1d23] text-gray-400 text-[11px] uppercase tracking-wider font-semibold">
                        <tr>
                          <th className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2d36]">
                            Product
                          </th>
                          <th className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2d36]">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2d36]">
                            MOQ
                          </th>
                          <th className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2d36]">
                            Lead
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-[#2a2d36]/50">
                        {deal.seller_quote.products.map((p, i) => (
                          <tr
                            key={i}
                            className="hover:bg-gray-50 dark:hover:bg-white/[0.03] bg-transparent dark:bg-white/[0.01]"
                          >
                            <td className="px-4 py-3 truncate max-w-[120px] font-medium">
                              {p.product_name}
                            </td>
                            <td className="px-4 py-3 font-mono text-gray-200 font-medium">
                              {formatCurrency(p.seller_unit_price)}
                            </td>
                            <td className="px-4 py-3 font-mono font-medium">
                              {p.moq}
                            </td>
                            <td className="px-4 py-3 text-[12px] font-medium text-gray-400">
                              {p.lead_time}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="h-[1px] bg-gray-200 dark:bg-[#2a2d36] w-full flex-shrink-0" />

            {/* SECTION 4: My Quotation */}
            <div className="p-6">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">
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
                  <span className="text-gray-400 text-[14px] font-semibold tracking-wide">
                    Quote not prepared yet
                  </span>
                </div>
              )}

              {displayQuote && (
                <div className="animate-fade-in">
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-[#2a2d36] bg-gray-100 dark:bg-[#242830]/50 shadow-sm flex flex-col">
                    <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                      <thead className="bg-gray-50 dark:bg-[#1a1d23] text-gray-400 text-[11px] uppercase tracking-wider font-semibold">
                        <tr>
                          <th className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2d36]">
                            Product
                          </th>
                          <th className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2d36]">
                            My Price
                          </th>
                          <th className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2d36]">
                            Margin
                          </th>
                          <th className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2d36] text-right">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-[#2a2d36]/50">
                        {displayQuote.products.map((p, i) => (
                          <tr
                            key={i}
                            className="hover:bg-gray-50 dark:hover:bg-white/[0.03] bg-transparent dark:bg-white/[0.01]"
                          >
                            <td className="px-4 py-3.5 truncate max-w-[120px] font-medium">
                              {p.product_name}
                            </td>
                            <td className="px-4 py-3.5 font-mono text-purple-300 font-bold">
                              {formatCurrency(p.my_unit_price)}
                            </td>
                            <td className="px-4 py-3.5 font-mono text-emerald-400 font-bold">
                              {p.margin_percent || p.applied_margin_percent}%
                            </td>
                            <td className="px-4 py-3.5 font-mono text-gray-900 dark:text-white text-right font-bold">
                              {formatCurrency(
                                p.total_price || p.total_my_price,
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="bg-gray-50 dark:bg-[#1a1d23] p-4.5 border-t border-gray-200 dark:border-[#2a2d36] flex flex-col gap-1.5 items-end">
                      <div className="text-[14px] text-gray-900 dark:text-white">
                        <span className="text-gray-400 mr-3 text-[13px] font-medium">
                          Total Deal Value:
                        </span>
                        <span className="font-bold font-mono tracking-wide">
                          {formatCurrency(totalDealValue)}
                        </span>
                      </div>
                      <div className="text-[14px] text-emerald-400">
                        <span className="text-emerald-500/70 mr-3 text-[13px] font-bold">
                          Total Profit:
                        </span>
                        <span className="font-bold font-mono tracking-wide">
                          {formatCurrency(totalDealValue - totalCostValue)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="h-[1px] bg-gray-200 dark:bg-[#2a2d36] w-full flex-shrink-0" />

            {/* SECTION 5: Email Preview */}
            <div className="p-6 mb-8 flex-shrink-0">
              <div className="flex items-center gap-6 border-b border-gray-200 dark:border-[#2a2d36] mb-5">
                <button
                  className={`pb-2.5 text-sm font-bold tracking-wide transition-colors relative ${activeTab === "RFQ" ? "text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                  onClick={() => setActiveTab("RFQ")}
                >
                  RFQ Email
                  {activeTab === "RFQ" && (
                    <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-purple-500 rounded-t" />
                  )}
                </button>
                <button
                  className={`pb-2.5 text-sm font-bold tracking-wide transition-colors relative ${activeTab === "QUOTE" ? "text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                  onClick={() => setActiveTab("QUOTE")}
                >
                  Buyer Quote
                  {activeTab === "QUOTE" && (
                    <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-purple-500 rounded-t" />
                  )}
                </button>
              </div>

              <div className="bg-white rounded-[10px] p-5 border border-gray-200 text-gray-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/80"></div>

                <div className="flex items-center border-b border-gray-100 pb-3 mb-3 text-[13px]">
                  <span className="w-16 font-bold text-gray-400 uppercase tracking-wider text-[11px]">
                    To:
                  </span>
                  <span className="font-semibold text-gray-700">
                    {activeTab === "RFQ"
                      ? "supplier@tbd.com"
                      : deal.buyer_email}
                  </span>
                </div>
                <div className="flex items-center border-b border-gray-100 pb-3 mb-4 text-[13px]">
                  <span className="w-16 font-bold text-gray-400 uppercase tracking-wider text-[11px]">
                    Subject:
                  </span>
                  <span className="font-semibold text-gray-800">
                    {activeTab === "RFQ"
                      ? `Request for Quotation - ${deal.inquiry_id}`
                      : `Quotation Details - ${deal.inquiry_id}`}
                  </span>
                </div>
                <div className="text-[13px] text-gray-600 whitespace-pre-line leading-[1.7] font-medium">
                  Dear{" "}
                  {activeTab === "RFQ"
                    ? "Supplier"
                    : deal.buyer_name.split(" ")[0]}
                  ,{"\n\n"}I hope this email finds you well.{"\n\n"}
                  Please find attached our{" "}
                  {activeTab === "RFQ"
                    ? "request for quotation"
                    : "quotation proposal"}{" "}
                  regarding the referenced products. We look forward to your
                  speedy response.{"\n\n"}
                  Best Regards,{"\n"}TradeMind Team
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  id="approve-send-btn"
                  onClick={() => setIsEmailModalOpen(true)}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold tracking-wide py-3 rounded-lg transition-colors shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                >
                  {displayQuote ? "Approve & Send Quote" : "Approve & Send"}
                </button>
                <button className="px-6 py-3 text-blue-400 font-bold border-2 border-blue-500/50 hover:bg-blue-500/10 hover:border-blue-400 rounded-lg transition-all active:scale-[0.98]">
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}
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
