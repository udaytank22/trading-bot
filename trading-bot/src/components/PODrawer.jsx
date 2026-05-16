import React, { useEffect } from "react";
import { formatINR } from "../services/marginEngine";
import StatusBadge from "./ui/StatusBadge";

export default function PODrawer({ po, isOpen, onClose }) {
  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!po && !isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-[100] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={handleBackdropClick}
      />

      {/* Side Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-xl bg-white dark:bg-[#1e2028] border-l border-gray-200 dark:border-[#2a2d36] z-[101] transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {po && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-8 border-b border-gray-200 dark:border-[#2a2d36] bg-gray-50 dark:bg-[#1a1d23]/50 relative">
              <button
                onClick={onClose}
                className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex items-center justify-between mb-4 pr-10">
                <span className="font-mono text-purple-400 text-sm font-bold tracking-widest">{po.po_id}</span>
                <StatusBadge status={po.status} />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">{po.customer}</h2>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Vessel: {po.vessel}</span>
              </div>
              <div className="mt-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                Date: {new Date(po.date).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              {/* Product Lines */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Order Items</h3>
                <div className="overflow-hidden border border-gray-200 dark:border-[#2a2d36] rounded-xl bg-gray-100 dark:bg-[#0c0e12]/30">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-[#0c0e12]/50 text-gray-400 text-[10px] uppercase tracking-widest border-b border-gray-200 dark:border-[#2a2d36]">
                        <th className="px-5 py-3 font-semibold">Description</th>
                        <th className="px-5 py-3 font-semibold text-right">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-[#2a2d36]/50">
                      {po.products.map((p, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-4 text-gray-900 dark:text-white font-medium">{p.product_name}</td>
                          <td className="px-5 py-4 text-right font-mono text-purple-400 font-bold">{p.quantity} PCS</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transaction Summary */}
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-[#2a2d36]">
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Financial Summary</h3>
                <div className="grid grid-cols-1 gap-4 bg-gray-100 dark:bg-[#0c0e12]/30 p-5 rounded-2xl border border-gray-200 dark:border-[#2a2d36]">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Total Amount</span>
                    <span className="text-gray-900 dark:text-white font-bold font-mono text-lg">{formatINR(po.total_amount || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Payment Terms</span>
                    <span className="text-gray-300 font-medium">30 Days Net</span>
                  </div>
                </div>
              </div>

              {/* Status Log */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Audit Trail</h3>
                <div className="space-y-4 ml-2">
                  <div className="flex gap-4 items-start relative pb-6 border-l-2 border-purple-500/20 pl-6">
                    <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                    <div>
                      <p className="text-gray-900 dark:text-white text-sm font-bold">PO Created</p>
                      <p className="text-gray-500 text-xs mt-1">Transaction initiated by System</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start pl-6">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-700 bg-white dark:bg-[#1e2028] ml-[-9px]" />
                    <div>
                      <p className="text-gray-600 text-sm font-bold">Ready for Shipment</p>
                      <p className="text-gray-700 text-xs mt-1">Waiting for logistics confirmation</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-gray-200 dark:border-[#2a2d36] bg-gray-50 dark:bg-[#1a1d23] flex gap-4">
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
          </div>
        )}
      </div>
    </>
  );
}
