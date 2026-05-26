import React, { useEffect } from "react";
import { formatINR } from "../services/marginEngine";
import StatusBadge from "./ui/statusBadge";

export default function PODrawer({ po, isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!po && !isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        className={`fixed inset-0 bg-black/60 z-[100]
        transition-opacity duration-300
        ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-0 z-[101]
        flex items-center justify-center p-4
        ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <div
          className={`relative
          w-full
          max-w-5xl
          h-full
          max-h-[90vh]
          bg-white
          dark:bg-[#1e2028]
          border
          border-gray-200
          dark:border-[#2a2d36]
          rounded-xl
          shadow-2xl
          flex
          flex-col
          overflow-hidden
          ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
        >
          {po && (
            <>
              {/* Header */}
              <div className="px-8 py-5 border-b border-gray-200 dark:border-[#2a2d36] bg-gray-50 dark:bg-[#1a1d23]/50 relative">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 dark:border-[#2a2d36] text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5 transition"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>

                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                        Purchase Order
                      </p>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {po.customer}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        View PO details and transaction summary.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-purple-500 text-sm font-bold">
                      {po.po_id}
                    </span>
                    <StatusBadge status={po.status} />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                  <div className="rounded-3xl border border-gray-200 dark:border-[#2a2d36] bg-white dark:bg-[#12131a] p-4">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-gray-400">
                      Vessel
                    </p>
                    <p className="mt-3 font-semibold text-gray-900 dark:text-white">
                      {po.vessel}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-gray-200 dark:border-[#2a2d36] bg-white dark:bg-[#12131a] p-4">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-gray-400">
                      Date
                    </p>
                    <p className="mt-3 font-semibold text-gray-900 dark:text-white">
                      {new Date(po.date).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-gray-200 dark:border-[#2a2d36] bg-white dark:bg-[#12131a] p-4">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-gray-400">
                      Total Amount
                    </p>
                    <p className="mt-3 font-semibold text-gray-900 dark:text-white">
                      {formatINR(po.total_amount || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                      Order Items
                    </h3>
                  </div>

                  <div className="overflow-hidden border border-gray-200 dark:border-[#2a2d36] rounded-3xl bg-gray-100 dark:bg-[#0c0e12]/30">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-[#0c0e12]/50 text-gray-400 text-[10px] uppercase tracking-widest border-b border-gray-200 dark:border-[#2a2d36]">
                          <th className="px-5 py-3 font-semibold">
                            Description
                          </th>
                          <th className="px-5 py-3 font-semibold text-right">
                            Quantity
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-[#2a2d36]/50">
                        {po.products?.map((item, index) => (
                          <tr
                            key={index}
                            className="hover:bg-white/[0.8] dark:hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-5 py-4 text-gray-900 dark:text-white font-medium">
                              {item.product_name}
                            </td>
                            <td className="px-5 py-4 text-right font-mono text-purple-400 font-bold">
                              {item.quantity} PCS
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-3xl border border-gray-200 dark:border-[#2a2d36] bg-gray-50 dark:bg-[#13161f] p-5">
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">
                      Audit Trail
                    </h4>
                    <div className="space-y-4 ml-2">
                      <div className="flex gap-4 items-start relative pb-6 border-l-2 border-purple-500/20 pl-6">
                        <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                        <div>
                          <p className="text-gray-900 dark:text-white text-sm font-bold">
                            PO Created
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            Transaction initiated by System
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4 items-start pl-6">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-700 bg-white dark:bg-[#1e2028] ml-[-9px]" />
                        <div>
                          <p className="text-gray-600 text-sm font-bold">
                            Ready for Shipment
                          </p>
                          <p className="text-gray-700 text-xs mt-1">
                            Waiting for logistics confirmation
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-gray-200 dark:border-[#2a2d36] bg-gray-50 dark:bg-[#13161f] p-5">
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">
                      Financial Summary
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">
                          Total Amount
                        </span>
                        <span className="text-gray-900 dark:text-white font-bold font-mono">
                          {formatINR(po.total_amount || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">
                          Payment Terms
                        </span>
                        <span className="text-gray-300 font-medium">
                          30 Days Net
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-5 border-t border-gray-200 dark:border-[#2a2d36] bg-gray-50 dark:bg-[#1a1d23] flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-6 rounded-xl bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-[#2a2d36] text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-200 dark:hover:bg-white/10 transition-all active:scale-95"
                >
                  Close View
                </button>
                <button className="flex-1 py-3 px-6 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20 active:scale-95">
                  Download PDF
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
