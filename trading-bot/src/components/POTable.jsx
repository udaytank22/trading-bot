import React from "react";
import Tooltip from "./ui/Tooltip";
import StatusBadge from "./ui/StatusBadge";
import { formatDateString } from "../services/marginEngine";

/* ── Helpers ─────────────────────────────────────────────────────── */
function DateCell({ isoString }) {
  if (!isoString) return null;
  const d = new Date(isoString);
  const timeStr = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
  return (
    <div className="flex flex-col">
      <span className="text-gray-900 dark:text-white font-bold leading-tight">
        {formatDateString(isoString)}
      </span>
      <span className="text-gray-500 text-xs mt-[1px]">{timeStr}</span>
    </div>
  );
}

const POTable = ({ items, onView, onOrder }) => {
  return (
    <div className="w-full overflow-hidden flex flex-col h-full">
      <div className="w-full overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
        <table className="w-full text-left text-sm table-auto border-separate border-spacing-0">
          <thead className="bg-gray-50 dark:bg-[#242830]/80 text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider border-b border-gray-200 dark:border-[#2a2d33] sticky top-0 z-10 backdrop-blur-md transition-colors duration-300">
            <tr>
              <th className="px-3 md:px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33]">
                PO ID
              </th>
              <th className="px-3 md:px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33]">
                Customer
              </th>
              <th className="px-3 md:px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33]">
                Vessel
              </th>
              <th className="px-3 md:px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33]">
                Products
              </th>
              <th className="px-3 md:px-6 py-4 hidden lg:table-cell border-b border-[#2a2d33]">
                Date
              </th>
              <th className="px-3 md:px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33]">
                Status
              </th>
              <th className="px-3 md:px-6 py-4 text-right border-b border-[#2a2d33]">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-[#2a2d33]/50">
            {items.map((po, idx) => (
              <tr
                key={po.po_id}
                className={`hover:bg-gray-50/80 dark:hover:bg-white/[0.04] transition-colors ${idx % 2 !== 0 ? "bg-gray-50/30 dark:bg-[#242830]/20" : ""
                  }`}
              >
                {/* PO ID */}
                <td className="px-3 md:px-6 py-4 font-mono text-gray-400 text-[12px] break-words">
                  <Tooltip content={po.po_id}>
                    <span className="cursor-default">{po.po_id}</span>
                  </Tooltip>
                </td>

                {/* Customer */}
                <td className="px-3 md:px-6 py-4">
                  <div className="flex flex-col">
                    <Tooltip content={po.customer}>
                      <span className="text-gray-900 dark:text-white font-bold text-sm break-words cursor-default">
                        {po.customer}
                      </span>
                    </Tooltip>
                  </div>
                </td>

                {/* Vessel */}
                <td className="px-3 md:px-6 py-4">
                  <Tooltip content={po.vessel}>
                    <span className="text-gray-600 dark:text-gray-300 text-sm font-medium cursor-default">
                      {po.vessel}
                    </span>
                  </Tooltip>
                </td>

                {/* Products */}
                <td className="px-3 md:px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <Tooltip content={po.products.map(p => p.product_name).join(", ")}>
                      <span className="text-gray-600 dark:text-gray-300 text-sm break-words cursor-default">
                        {po.products[0]?.product_name}
                      </span>
                    </Tooltip>

                    {po.products.length > 1 && (
                      <Tooltip content={po.products.map(p => p.product_name).join(", ")}>
                        <span className="inline-block w-fit px-2 py-[2px] bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 text-[10px] font-bold rounded-lg cursor-default border border-gray-200 dark:border-none">
                          +{po.products.length - 1} more
                        </span>
                      </Tooltip>
                    )}
                  </div>
                </td>

                {/* Date */}
                <td className="px-3 md:px-6 py-4 hidden lg:table-cell">
                  <Tooltip content={new Date(po.date).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}>
                    <DateCell isoString={po.date} />
                  </Tooltip>
                </td>

                {/* Status */}
                <td className="px-3 md:px-6 py-4">
                  <StatusBadge status={po.status} />
                </td>

                {/* Actions */}
                <td className="px-3 md:px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onView(po)}
                      className="px-3 py-2 text-xs font-bold text-purple-400 border border-purple-500/40 rounded-lg hover:bg-purple-500/10 transition-all shadow-sm whitespace-nowrap"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onOrder(po)}
                      className="px-3 py-2 text-xs font-bold text-purple-400 border border-purple-500/40 rounded-lg hover:bg-purple-500/10 transition-all shadow-sm whitespace-nowrap"
                    >
                      order
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default POTable;
