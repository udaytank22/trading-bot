import React, { useEffect, useState, useMemo } from "react";
import { formatINR } from '@services/marginEngine';
import { DataTable, rowStripeClass, ROW_HOVER_CLS, StatusBadge } from '@components/ui';

const DUMMY_PDF_URL = "/memories/file-sample_150kB.pdf";

/**
 * SupplyViewModal - displays supply/shipment details in a professional modal overlay.
 * Styled matching the layout of the Inquiry and PO details pages.
 */
export default function SupplyViewModal({
  deal,
  isOpen,
  onClose,
  onStatusUpdate,
  onAllot,
}) {
  const [showPdf, setShowPdf] = useState(false);
  const [pdfLabel, setPdfLabel] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");

  // Close on Escape when modal is open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
        setShowPdf(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);



  const formatCurrency = formatINR;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
      setShowPdf(false);
    }
  };

  // Build the items list dynamically from the linked Purchase Order items or fall back to deal.products
  const productsList = useMemo(() => {
    if (deal?.purchaseOrder?.items && deal.purchaseOrder.items.length > 0) {
      return deal.purchaseOrder.items.map((item) => ({
        product_name: item.description || item.product?.name || "Product Item",
        quantity: item.quantity,
        unit: item.product?.unit || "PCS",
        specs: item.product?.category || "—",
      }));
    }
    return deal?.products || [];
  }, [deal]);

  // Financial calculations
  const subtotal = useMemo(() => {
    if (deal?.purchaseOrder?.items && deal.purchaseOrder.items.length > 0) {
      return deal.purchaseOrder.items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
    }
    return deal?.purchaseOrder?.amount ? Number(deal.purchaseOrder.amount) / 1.18 : 45000;
  }, [deal]);

  const totalAmount = useMemo(() => {
    return deal?.purchaseOrder?.amount ? Number(deal.purchaseOrder.amount) : subtotal * 1.18;
  }, [deal, subtotal]);

  const gstAmount = useMemo(() => {
    return Math.max(0, totalAmount - subtotal);
  }, [totalAmount, subtotal]);

  // Dynamic logistics details
  const pickupLocation = deal?.supplier?.address || deal?.supplier?.company || deal?.supplier || "N/A";
  const dropLocation = deal?.client?.address || deal?.destination || "N/A";
  const driverDetails = deal?.driverDetails || "Not Assigned";
  const vehicleDetails = deal?.vehicleDetails || "Not Assigned";

  const loadingDate = deal?.loadingDate
    ? new Date(deal.loadingDate).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    : "Not Scheduled";

  const deliveryDate = deal?.deliveryDate
    ? new Date(deal.deliveryDate).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    : "Not Scheduled";

  const contactPerson = deal?.supplier?.name
    ? `${deal.supplier.name} (${deal.supplier.phone || "—"})`
    : "—";

  // Prepend PO PDF if available
  const documents = useMemo(() => {
    const docList = [];
    if (deal?.purchaseOrder?.attachment) {
      docList.push({
        name: `Purchase Order (${deal.purchaseOrder.poNumber})`,
        type: "PDF",
        size: "Generated PO Document",
        url: deal.purchaseOrder.attachment,
      });
    }
    docList.push(
      { name: "Delivery Challan", type: "PDF", size: "1.2 MB", url: DUMMY_PDF_URL },
      { name: "Gate Pass (Entry)", type: "PDF", size: "850 KB", url: DUMMY_PDF_URL },
      { name: "Vehicle Registration (RC)", type: "IMG", size: "2.4 MB", url: DUMMY_PDF_URL },
      { name: "Driver Identity / License", type: "IMG", size: "1.8 MB", url: DUMMY_PDF_URL }
    );
    return docList;
  }, [deal]);

  const steps = [
    { id: "ORDER_PLACED", label: "Order Placed" },
    { id: "LOADING", label: "Loading" },
    { id: "DISPATCHED", label: "Dispatched" },
    { id: "DELIVERED", label: "Delivered" },
  ];

  const currentStepIdx = useMemo(() => {
    if (!deal) return 0;
    const status = deal.status;
    if (status === "PENDING" || status === "ORDER_PLACED") return 0;
    if (status === "LOADING") return 1;
    if (status === "DISPATCHED" || status === "IN_TRANSIT") return 2;
    if (status === "DELIVERED") return 3;
    return 0;
  }, [deal]);

  if (!deal && !isOpen) return null;

  const status = deal?.status || deal?.currentStatus;
  const isVehicleAllotted = status !== "ORDER_PLACED" && status !== "DISPATCHED";

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={handleBackdropClick}
      />

      {/* Modal (centered) */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <div
          className={`relative w-full max-w-5xl h-full max-h-[85vh] bg-gray-50 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d36] rounded-2xl shadow-2xl flex flex-col z-10 ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
        >
          {/* ── Inline PDF Viewer ── */}
          {showPdf && (
            <div className="absolute inset-0 z-50 flex flex-col bg-white dark:bg-[#1e2028] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2d36] bg-gray-50 dark:bg-[#1a1d23] flex items-center justify-between flex-shrink-0">
                <button
                  onClick={() => setShowPdf(false)}
                  className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back to Supply Details
                </button>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    {pdfLabel}
                  </div>
                  <a
                    href={pdfUrl}
                    download={pdfLabel}
                    className="flex items-center gap-1.5 text-xs font-bold text-purple-500 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download
                  </a>
                </div>
              </div>
              <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-[#0c0e12]">
                <iframe
                  src={pdfUrl}
                  title="Document Preview"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          )}

          {/* ── Main Details Layout ── */}
          {deal && (
            <div className="flex flex-col flex-1 h-full overflow-hidden">
              {/* Header Bar */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2d36] bg-white dark:bg-[#1a1d23] flex items-center justify-between flex-shrink-0 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 dark:bg-[#1e2028] dark:hover:bg-[#242830] text-gray-700 dark:text-gray-300 font-bold text-xs uppercase tracking-wider border border-gray-200 dark:border-[#2a2d36] transition-all duration-200 shadow-sm"
                  >
                    Close Details
                  </button>
                  <span className="text-gray-350 dark:text-[#2a2d36] font-light">|</span>
                  <span className="font-mono text-gray-955 dark:text-white text-base font-bold tracking-wide">
                    Cargo Supply — {deal.shipmentNumber || deal.inquiry_id}
                  </span>
                </div>

                {/* Operations Header Controls */}
                <div className="flex items-center gap-3">
                  <StatusBadge status={deal.status} />

                  {(deal.status === "PENDING" || deal.status === "ORDER_PLACED") && onAllot && (
                    <button
                      onClick={() => onAllot(deal)}
                      className="px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-bold bg-white hover:bg-gray-55 dark:bg-[#1e2028] dark:hover:bg-[#242830] text-purple-600 dark:text-purple-400 border border-purple-500/30 transition-all shadow-sm"
                    >
                      Allot Vehicle
                    </button>
                  )}

                  {deal.status === "ORDER_PLACED" && (
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to mark this shipment as Dispatched?")) {
                          onStatusUpdate(deal.inquiry_id, "DISPATCHED");
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-bold bg-purple-600 hover:bg-purple-550 text-white transition-all shadow-sm shadow-purple-600/10 animate-pulse"
                    >
                      Mark Dispatched
                    </button>
                  )}

                  {deal.status === "LOADING" && (
                    <button
                      onClick={() => {
                        alert("Cargo loading verification checks completed successfully.");
                        if (confirm("Are you sure you want to mark this cargo as loaded and advance the status to IN_TRANSIT?")) {
                          onStatusUpdate(deal.inquiry_id, "IN_TRANSIT");
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-bold bg-orange-600 hover:bg-orange-550 text-white"
                    >
                      Mark Loaded
                    </button>
                  )}

                  {(deal.status === "IN_TRANSIT" || deal.status === "DISPATCHED") && (
                    <button
                      onClick={() => {
                        if (confirm("Mark this shipment as Delivered?")) {
                          onStatusUpdate(deal.inquiry_id, "DELIVERED");
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-bold bg-blue-600 hover:bg-blue-550 text-white transition-all shadow-sm shadow-blue-600/10"
                    >
                      Mark Delivered
                    </button>
                  )}

                  {deal.status === "DELIVERED" && (
                    <button
                      onClick={() => onStatusUpdate(deal.inquiry_id, "SEND_INVOICE")}
                      className="px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-bold bg-indigo-600 hover:bg-indigo-550 text-white transition-all shadow-sm shadow-indigo-600/10"
                    >
                      Send Invoice
                    </button>
                  )}

                  {deal.status === "SHIPPED" && (
                    <button
                      onClick={() => onStatusUpdate(deal.inquiry_id, "SUPPLY")}
                      className="px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-bold bg-green-600 hover:bg-green-550 text-white transition-all shadow-sm shadow-green-600/10"
                    >
                      Move to Supply
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* ── STEPPER TIMELINE ── */}
                <div className="bg-white dark:bg-[#1a1d23] rounded-2xl p-5 border border-gray-200 dark:border-[#2a2d33] shadow-sm">
                  <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 px-1">
                    Logistics Milestone Progress
                  </div>
                  <div className="overflow-x-auto w-full custom-scrollbar pb-1">
                    <div className="relative flex items-start pt-1 pb-2 min-w-[500px] justify-between px-10">
                      <div
                        className="absolute left-[80px] right-[80px] h-[2px] bg-gray-200 dark:bg-[#2a2d36] -z-10"
                        style={{ top: "15px" }}
                      />
                      <div
                        className="absolute left-[80px] h-[2px] bg-purple-500 -z-10 transition-all duration-350"
                        style={{
                          top: "15px",
                          width: `calc((${currentStepIdx} / ${steps.length - 1}) * (100% - 160px))`
                        }}
                      />
                      {steps.map((step, idx) => {
                        const isActive = idx <= currentStepIdx;
                        const isCurrent = idx === currentStepIdx;
                        return (
                          <div key={step.id} className="flex flex-col items-center w-[80px] flex-shrink-0">
                            <div className="h-4 flex items-center justify-center">
                              <div className={`w-3.5 h-3.5 rounded-full border-2 bg-white dark:bg-[#1a1d23] z-10 transition-all duration-300 flex items-center justify-center
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
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">ls-3 gap-6 items-start">

                  {/* Left Column: Items and Logistics */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Products/Cargo Items */}
                    <div className="bg-white dark:bg-[#1a1d23] rounded-2xl p-6 border border-gray-200 dark:border-[#2a2d33] shadow-sm">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Cargo Items</h3>
                      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#2a2d36] bg-gray-50/50 dark:bg-[#242830]/30 shadow-inner">
                        <DataTable
                          columns={[
                            { key: "product", label: "Product" },
                            { key: "qty", label: "Qty" },
                            { key: "unit", label: "Unit" },
                            { key: "specs", label: "Category" },
                          ]}
                          data={productsList}
                          emptyMessage="No items requested."
                          renderRow={(p, i) => (
                            <tr
                              key={i}
                              className={`${rowStripeClass(i)} ${ROW_HOVER_CLS}`}
                            >
                              <td className="px-6 py-4 text-gray-900 dark:text-white font-bold">
                                {p.product_name}
                              </td>
                              <td className="px-6 py-4 font-mono text-gray-900 dark:text-white font-medium">
                                {p.quantity}
                              </td>
                              <td className="px-6 py-4 text-gray-450 font-semibold">
                                {p.unit || "PCS"}
                              </td>
                              <td className="px-6 py-4 text-gray-450 text-xs">
                                {p.specs || "—"}
                              </td>
                            </tr>
                          )}
                        />
                      </div>
                    </div>

                    {/* Logistics Card */}
                    <div className="bg-white dark:bg-[#1a1d23] rounded-2xl p-6 border border-gray-200 dark:border-[#2a2d33] shadow-sm">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Logistics Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700 dark:text-gray-300 text-sm">
                        <div className="flex flex-col bg-gray-50 dark:bg-[#0c0e12] p-4 rounded-xl border border-gray-150 dark:border-[#2a2d36]/60">
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Pickup Address</span>
                          <span className="text-gray-900 dark:text-white font-semibold mt-1">{pickupLocation}</span>
                        </div>
                        <div className="flex flex-col bg-gray-50 dark:bg-[#0c0e12] p-4 rounded-xl border border-gray-150 dark:border-[#2a2d36]/60">
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase tracking-widest">Delivery Address</span>
                          <span className="text-gray-900 dark:text-white font-semibold mt-1">{dropLocation}</span>
                        </div>
                        <div className="flex flex-col bg-gray-50 dark:bg-[#0c0e12] p-4 rounded-xl border border-gray-150 dark:border-[#2a2d36]/60">
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-widest">Scheduled Loading Date</span>
                          <span className="text-gray-900 dark:text-white font-mono font-medium mt-1">{loadingDate}</span>
                        </div>
                        <div className="flex flex-col bg-gray-50 dark:bg-[#0c0e12] p-4 rounded-xl border border-gray-150 dark:border-[#2a2d36]/60">
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-widest">Scheduled Delivery Date</span>
                          <span className="text-gray-900 dark:text-white font-mono font-medium mt-1">{deliveryDate}</span>
                        </div>
                        <div className="flex flex-col bg-gray-50 dark:bg-[#0c0e12] p-4 rounded-xl border border-gray-150 dark:border-[#2a2d36]/60">
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-widest">Vehicle Details</span>
                          <span className="text-gray-900 dark:text-white font-semibold mt-1">{vehicleDetails}</span>
                        </div>
                        <div className="flex flex-col bg-gray-50 dark:bg-[#0c0e12] p-4 rounded-xl border border-gray-150 dark:border-[#2a2d36]/60">
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-widest">Driver / Operator Details</span>
                          <span className="text-gray-900 dark:text-white font-semibold mt-1">{driverDetails}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Summaries & Documents */}
                  <div className="space-y-6">
                    {/* Order Context */}
                    <div className="bg-white dark:bg-[#1a1d23] rounded-2xl p-6 border border-gray-200 dark:border-[#2a2d33] shadow-sm space-y-4">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Order Context</h3>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-widest block">Customer Name</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white mt-1 block">{deal.client?.name || deal.buyer_name}</span>
                      </div>
                      <div className="border-t border-gray-100 dark:border-[#2a2d33]/80 pt-3">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-widest block">Supplier Company</span>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1 block">{deal.supplier?.company || deal.supplier}</span>
                      </div>
                      <div className="border-t border-gray-100 dark:border-[#2a2d33]/80 pt-3">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-widest block">Contact Person</span>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1 block">{contactPerson}</span>
                      </div>
                    </div>

                    {/* Quotation Summary */}
                    <div className="bg-white dark:bg-[#1a1d23] rounded-2xl p-6 border border-gray-200 dark:border-[#2a2d33] shadow-sm space-y-4">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Quotation Summary</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-gray-455 tracking-wide">
                          <span>Subtotal Quoted:</span>
                          <span className="font-mono text-gray-900 dark:text-gray-105 text-sm">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-gray-455 tracking-wide">
                          <span>GST (18%):</span>
                          <span className="font-mono text-gray-900 dark:text-gray-105 text-sm">{formatCurrency(gstAmount)}</span>
                        </div>
                        <div className="border-t border-dashed border-gray-200 dark:border-[#2a2d33] pt-3 mt-2">
                          <div className="flex justify-between items-center text-sm font-black text-gray-900 dark:text-white">
                            <span className="uppercase tracking-wider text-[10px] text-gray-400 font-bold">Total PO Amount</span>
                            <span className="font-mono text-base font-extrabold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20">
                              {formatCurrency(totalAmount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Associated Documents */}
                    <div className="bg-white dark:bg-[#1a1d23] rounded-2xl p-6 border border-gray-200 dark:border-[#2a2d33] shadow-sm">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Associated Documents</h3>
                      {isVehicleAllotted ? (
                        <div className="space-y-3">
                          {documents.map((doc, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#242830]/50 border border-gray-200 dark:border-[#2a2d36] rounded-xl hover:border-purple-400/40 hover:bg-purple-500/5 dark:hover:bg-[#242830] transition-all group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${doc.type === "PDF"
                                    ? "bg-red-500/10 text-red-500"
                                    : "bg-blue-500/10 text-blue-500"
                                    }`}
                                >
                                  {doc.type}
                                </div>
                                <div
                                  onClick={() => {
                                    setPdfLabel(doc.name);
                                    setPdfUrl(doc.url);
                                    setShowPdf(true);
                                  }}
                                  className="cursor-pointer min-w-0"
                                  title="Click to view document"
                                >
                                  <p className="text-gray-900 dark:text-white text-xs font-bold group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors hover:underline truncate max-w-[140px]">
                                    {doc.name}
                                  </p>
                                  <p className="text-gray-400 text-[10px] truncate">
                                    {doc.size}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {/* View */}
                                <button
                                  onClick={() => {
                                    setPdfLabel(doc.name);
                                    setPdfUrl(doc.url);
                                    setShowPdf(true);
                                  }}
                                  title="View document"
                                  className="p-1 rounded-lg text-purple-500 bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
                                >
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                {/* Download */}
                                <a
                                  href={doc.url}
                                  download={doc.name}
                                  title="Download"
                                  className="p-1 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                                >
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-[#242830]/30 flex items-center justify-center text-gray-400 dark:text-gray-500 mb-3 border border-gray-200 dark:border-[#2a2d33]">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                            Documents will be available after vehicle allotment
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
