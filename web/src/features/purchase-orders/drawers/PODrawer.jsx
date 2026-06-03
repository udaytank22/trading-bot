import React, { useEffect } from "react";
import { formatINR } from '@services/marginEngine';
import { StatusBadge, DataTable, rowStripeClass, ROW_HOVER_CLS } from '@components/ui';

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

  // Calculations
  const subtotal = po?.products?.reduce((sum, item) => sum + (item.total_price || 0), 0) || 0;
  const totalAmount = po?.total_amount || po?.amount || (subtotal * 1.18);
  const gstAmount = Math.max(0, totalAmount - subtotal);

  return (
    <>
      {/* Backdrop & Drawer Container */}
      <div
        onClick={handleBackdropClick}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300 flex items-center justify-center p-4
        ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <div
          className={`relative w-full max-w-4xl max-h-[90vh] bg-gray-50 dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300
          ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
        >
          {po && (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33] bg-gray-50 dark:bg-[#1a1d23] relative">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 dark:border-[#2a2d33] text-gray-400 hover:bg-white/5 hover:text-white transition"
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
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Purchase Order
                      </p>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        {po.customer}
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        View PO details and transaction summary.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-purple-400 text-sm font-bold">
                      {po.po_id}
                    </span>
                    <StatusBadge status={po.status} />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-100 dark:bg-[#0c0e12] p-5 rounded-2xl border border-gray-200 dark:border-[#2a2d33]">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                      Vessel
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {po.vessel}
                    </p>
                  </div>
                  <div className="bg-gray-100 dark:bg-[#0c0e12] p-5 rounded-2xl border border-gray-200 dark:border-[#2a2d33]">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                      Date
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
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
                  <div className="bg-gray-100 dark:bg-[#0c0e12] p-5 rounded-2xl border border-gray-200 dark:border-[#2a2d33]">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                      Total Amount
                    </p>
                    <p className="text-lg font-mono font-bold text-purple-400">
                      {formatINR(totalAmount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                      Order Items ({po.products?.length || 0})
                    </h3>
                  </div>

                  <div className="border border-gray-200 dark:border-[#2a2d33] rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#0c0e12]">
                    <DataTable
                      columns={[
                        { key: "description", label: "Product" },
                        { key: "unitPrice", label: "Unit Price" },
                        { key: "quantity", label: "Quantity" },
                        { key: "totalPrice", label: "Total Price", className: "text-right" },
                      ]}
                      data={po.products || []}
                      emptyMessage="No items found."
                      renderRow={(item, index) => (
                        <tr
                          key={index}
                          className={`${rowStripeClass(index)} ${ROW_HOVER_CLS}`}
                        >
                          <td className="px-6 py-4 text-gray-900 dark:text-white font-bold">
                            {item.product_name}
                          </td>
                          <td className="px-6 py-4 font-mono text-gray-400">
                            {formatINR(item.unit_price || 0)}
                          </td>
                          <td className="px-6 py-4 font-mono text-gray-900 dark:text-white font-medium">
                            {item.quantity} PCS
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-purple-300 text-base">
                            {formatINR(item.total_price || 0)}
                          </td>
                        </tr>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-100 dark:bg-[#0c0e12] p-5 rounded-2xl border border-gray-200 dark:border-[#2a2d33]">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-4">
                      Audit Trail
                    </h4>
                    <div className="space-y-4 ml-2">
                      <div className="flex gap-4 items-start relative pb-6 border-l-2 border-purple-500/20 pl-6">
                        <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                        <div>
                          <p className="text-gray-900 dark:text-white text-sm font-bold animate-pulse">
                            PO Created
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            Transaction initiated by System
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4 items-start pl-6">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-700 bg-white dark:bg-[#0c0e12] ml-[-9px]" />
                        <div>
                          <p className="text-gray-600 text-sm font-bold">
                            Ready for Shipment
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            Waiting for logistics confirmation
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-100 dark:bg-[#0c0e12] p-5 rounded-2xl border border-gray-200 dark:border-[#2a2d33]">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-4">
                      Financial Summary
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                          Subtotal (Excl. Tax)
                        </span>
                        <span className="text-gray-900 dark:text-white font-bold font-mono">
                          {formatINR(subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                          GST (18%)
                        </span>
                        <span className="text-gray-900 dark:text-white font-bold font-mono">
                          {formatINR(gstAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t border-dashed border-gray-200 dark:border-[#2a2d33] pt-4 mt-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                          Total Amount (Incl. Tax)
                        </span>
                        <span className="text-purple-400 font-extrabold font-mono text-base bg-purple-500/10 px-3.5 py-1.5 rounded-xl border border-purple-500/20 shadow-sm">
                          {formatINR(totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 dark:border-[#2a2d33] flex gap-4 bg-gray-50 dark:bg-[#1a1d23] mt-8">
                <button
                  onClick={onClose}
                  className="px-8 py-3 rounded-xl border border-gray-200 dark:border-[#2a2d33] text-gray-400 text-sm font-bold hover:bg-white/[0.05] hover:text-white transition-all"
                >
                  Close View
                </button>
                <button className="flex-1 px-8 py-3 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20">
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
