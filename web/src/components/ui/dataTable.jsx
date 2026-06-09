/**
 * @file DataTable.jsx
 * @description Centralized, reusable data table shell for TradeMind.
 *
 * PROBLEM SOLVED:
 *   Every table (Inquiry, PO, Supply, Account, Employee) had its own copy of:
 *     - The same <table> wrapper classes
 *     - The same <thead> sticky style
 *     - The same <tbody> stripe/hover classes
 *     - The same scrollbar container
 *   That was ~40 lines of duplicated markup per table.
 *
 * ARCHITECTURE:
 *   DataTable renders the chrome (scroll container, <table>, <thead>, <tbody>).
 *   Callers supply:
 *     - `columns`  → array of { key, label, className?, hidden? } header definitions
 *     - `data`     → array of row objects
 *     - `renderRow`→ render function  (row, index) => <tr> JSX
 *     - `emptyMessage` → fallback text when data is empty
 *
 * USAGE:
 *   <DataTable
 *     columns={[
 *       { key: "id",   label: "ID" },
 *       { key: "name", label: "Name" },
 *       { key: "actions", label: "Actions", className: "text-right" },
 *     ]}
 *     data={employees}
 *     renderRow={(emp, idx) => (
 *       <tr key={emp.id} className={rowCls(idx)}>
 *         <td>...</td>
 *       </tr>
 *     )}
 *     emptyMessage="No employees found."
 *   />
 *
 * @author TradeMind Dev Team
 */

import React from "react";
import EmptyState from "./emptyState";

// ─── Shared row stripe helper (exported so individual tables can use it) ───────

/**
 * Returns the alternating background class for zebra-stripe rows.
 * @param {number} idx - Row index (0-based)
 * @returns {string} Tailwind class string
 */
export function rowStripeClass(idx) {
  return idx % 2 !== 0
    ? "bg-gray-50/30 dark:bg-[#242830]/20"
    : "";
}

/** Standard row hover class used by every table */
export const ROW_HOVER_CLS =
  "hover:bg-gray-50/80 dark:hover:bg-white/[0.04] transition-colors";

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * @param {Object} props
 * @param {Array<{key:string, label:string, className?:string, hidden?:string}>} props.columns
 *        - Column definitions. `hidden` is a Tailwind responsive class e.g. "hidden lg:table-cell"
 * @param {Array<any>} props.data - Row data array (used only to detect empty state)
 * @param {function(any, number): React.ReactNode} props.renderRow - Render function for each <tr>
 * @param {string} [props.emptyMessage="No data found."] - Message shown when data is empty
 * @param {string} [props.maxHeight="max-h-[600px]"] - Tailwind max-height for the scroll container
 */
export default function DataTable({
  columns = [],
  data = [],
  renderRow,
  emptyMessage = "No data found.",
  maxHeight = "max-h-[600px]",
}) {
  return (
    /* Outer wrapper — hides overflow for rounded corners */
    <div className="w-full overflow-hidden flex flex-col ">

      {/* Scrollable container — both axes, styled scrollbar */}
      <div className={`w-full max-w-full overflow-auto ${maxHeight} custom-scrollbar`}>

        {/* Main table — auto layout so columns size to content */}
        <table className="w-full text-left text-sm table-auto border-collapse">

          {/* ── HEADER ─────────────────────────────────────────────────────── */}
          <thead className="sticky top-0 z-20 transition-all duration-300">
            <tr className="bg-gray-50 dark:bg-[#1f2229] shadow-sm">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={[
                    "px-2 sm:px-3 md:px-4 py-2 sm:py-2.5",
                    "text-gray-400 dark:text-gray-500",
                    "text-[10px] font-black uppercase tracking-wider",
                    "border-b border-gray-100 dark:border-white/5",
                    col.hidden ?? "",
                    col.className ?? "",
                  ].join(" ")}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* ── BODY ───────────────────────────────────────────────────────── */}
          <tbody className="divide-y divide-gray-100 dark:divide-[#2a2d33]/50">
            {data.length > 0 ? (
              // Delegate row rendering to the caller — they know the shape of their data
              data.map((row, idx) => renderRow(row, idx))
            ) : (
              // Empty state row spans all columns
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <EmptyState title={emptyMessage} description="" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
