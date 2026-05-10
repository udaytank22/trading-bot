import React, { useEffect } from "react";
import { formatINR } from "../services/marginEngine";

/**
 * SupplyViewModal - displays deal details in a modal overlay.
 * UI is identical to DealDrawer but presented as a centered modal.
 */
export default function SupplyViewModal({
  deal,
  isOpen,
  onClose,
  onStatusUpdate,
}) {
  // Close on Escape when modal is open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!deal && !isOpen) return null;

  const formatCurrency = formatINR;

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/20 tracking-wide uppercase">
            PENDING
          </span>
        );
      case "RFQ_SENT":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-500 border border-blue-500/20 tracking-wide uppercase">
            RFQ SENT
          </span>
        );
      case "QUOTE_SENT":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-green-500/20 text-green-500 border border-green-500/20 tracking-wide uppercase">
            QUOTE SENT
          </span>
        );
      case "CLOSED":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-500/20 text-gray-400 border border-gray-500/20 tracking-wide uppercase">
            CLOSED
          </span>
        );
      default:
        return null;
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={handleBackdropClick}
      />

      {/* Drawer Modal */}
      <div
        className={`fixed top-0 right-0 h-full w-[500px] bg-[#1e2028] border-l border-[#2a2d36] z-50 transform transition-transform duration-300 ease-in-out flex flex-col overflow-y-auto shadow-2xl ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex flex-col flex-1 h-fit">
          {/* Reuse the drawer's inner UI */}
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
                  {getStatusBadge(deal.status)}
                </div>
                <div className="text-white text-[20px] font-bold leading-tight tracking-wide">
                  {deal.buyer_name}
                </div>
                <div className="text-gray-400 text-[14px] mt-1 tracking-wide">
                  {deal.buyer_email}
                </div>
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

              <div className="h-[1px] bg-[#2a2d36] w-full" />

              {/* SECTION 2: Products Requested */}
              <div className="p-6">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">
                  Products Requested
                </div>
                <div className="overflow-x-auto rounded-lg border border-[#2a2d36] bg-[#242830]/50 shadow-sm">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-[#1a1d23] text-gray-400 text-[11px] font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 border-b border-[#2a2d36]">
                          Product
                        </th>
                        <th className="px-4 py-3 border-b border-[#2a2d36]">
                          Qty
                        </th>
                        <th className="px-4 py-3 border-b border-[#2a2d36]">
                          Unit
                        </th>
                        <th className="px-4 py-3 border-b border-[#2a2d36]">
                          Specs
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2d36]/50">
                      {deal.products.map((p, i) => (
                        <tr
                          key={i}
                          className="hover:bg-white/[0.03] bg-white/[0.01]"
                        >
                          <td className="px-4 py-3 text-white font-medium">
                            {p.product_name}
                          </td>
                          <td className="px-4 py-3 font-mono font-medium">
                            {p.quantity ? p.quantity : 100}
                          </td>
                          <td className="px-4 py-3 text-gray-400">
                            {p.unit ? p.unit : 100}
                          </td>
                          <td
                            className="px-4 py-3 truncate max-w-[120px] text-gray-400 text-xs"
                            title={p.specs}
                          >
                            {p.specs ? p.specs : 100}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="h-[1px] bg-[#2a2d36] w-full" />

              {/* SECTION 3A: Quoted & Final Amount */}
              <div className="p-6">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">
                  Quotation Summary
                </div>
                <div className="grid grid-cols-2 gap-4 text-gray-300 text-sm">
                  <div>
                    <span className="text-gray-400 mr-2">Quoted Amount:</span>
                    <span className="font-medium">{formatCurrency(45000)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 mr-2">Final Amount:</span>
                    <span className="font-medium">{formatCurrency(38500)}</span>
                  </div>
                </div>
              </div>
              {/* SECTION 3B: Logistics Details */}
              <div className="p-6">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">
                  Logistics Details
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300 text-sm">
                  <div>
                    <span className="text-gray-400 mr-2">Pickup From:</span>
                    <span className="font-medium">
                      Industrial Area, Sector 62, Noida
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 mr-2">Pickup Time:</span>
                    <span className="font-medium">Oct 24, 2023, 10:30 AM</span>
                  </div>
                  <div>
                    <span className="text-gray-400 mr-2">Drop To:</span>
                    <span className="font-medium">
                      Global Logistics Park, Bhiwandi
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 mr-2">Drop Time:</span>
                    <span className="font-medium">Oct 25, 2023, 04:00 PM</span>
                  </div>
                  <div>
                    <span className="text-gray-400 mr-2">Picked By:</span>
                    <span className="font-medium">Rajesh Kumar</span>
                  </div>
                  <div>
                    <span className="text-gray-400 mr-2">Vehicle:</span>
                    <span className="font-medium">
                      Tata Ace (MH-04-JK-1234)
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400 mr-2">Contact Person:</span>
                    <span className="font-medium">
                      Amit Sharma (+91 98765 43210)
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-[1px] bg-[#2a2d36] w-full" />

              {/* SECTION 3C: Associated Documents */}
              <div className="p-6">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">
                  Associated Documents
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { name: "Delivery Challan", type: "PDF", size: "1.2 MB" },
                    { name: "Gate Pass (Entry)", type: "PDF", size: "850 KB" },
                    {
                      name: "Vehicle Registration (RC)",
                      type: "IMG",
                      size: "2.4 MB",
                    },
                    {
                      name: "Driver Identity / License",
                      type: "IMG",
                      size: "1.8 MB",
                    },
                  ].map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-[#242830]/50 border border-[#2a2d36] rounded-xl hover:bg-[#242830] transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-[10px]">
                          {doc.type}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {doc.name}
                          </p>
                          <p className="text-gray-500 text-[11px]">
                            {doc.size} • Verified
                          </p>
                        </div>
                      </div>
                      <button className="p-2 text-gray-500 hover:text-emerald-400 transition-colors">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
