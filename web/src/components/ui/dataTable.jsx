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

import React, { useRef } from "react";
import EmptyState from "./emptyState";
import Pagination from "./pagination";
import { useVirtualizer } from '@tanstack/react-virtual';

// ─── Shared row stripe helper (exported so individual tables can use it) ───────

/**
 * Returns the alternating background class for zebra-stripe rows.
 * @param {number} idx - Row index (0-based)
 * @returns {string} Tailwind class string
 */
export function rowStripeClass(idx) {
  return "bg-white dark:bg-[#1a1d23]";
}

/** Standard row hover class used by every table */
export const ROW_HOVER_CLS =
  "hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors";

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * @param {Object} props
 * @param {Array<{key:string, label:string, className?:string, hidden?:string}>} props.columns
 *        - Column definitions. `hidden` is a Tailwind responsive class e.g. "hidden lg:table-cell"
 * @param {Array<any>} props.data - Row data array (used only to detect empty state)
 * @param {function(any, number): React.ReactNode} props.renderRow - Render function for each <tr>
 * @param {string} [props.emptyMessage="No data found."] - Message shown when data is empty
 * @param {string} [props.maxHeight="max-h-[600px]"] - Tailwind max-height for the scroll container
 * @param {function(): React.ReactNode} [props.renderFooter] - Optional render function for tfoot
 * @param {Object} [props.paginationProps] - Props to pass to the Pagination component
 */
export default function DataTable({
  columns = [],
  data = [],
  renderRow,
  emptyMessage = "No data found.",
  maxHeight = "max-h-[600px]",
  className = "",
  renderFooter,
  paginationProps,
  isLoading = false
}) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom = virtualItems.length > 0
    ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
    : 0;

  return (
    /* Outer wrapper — hides overflow for rounded corners */
    <div className={`w-full overflow-hidden flex flex-col ${className}`}>

      {/* Scrollable container — both axes, styled scrollbar */}
      <div
        ref={parentRef}
        className={`w-full max-w-full overflow-auto ${maxHeight} custom-scrollbar`}
      >

        {/* Main table — auto layout so columns size to content */}
        <table className="w-full text-left text-sm table-auto border-collapse">

          {/* ── HEADER ─────────────────────────────────────────────────────── */}
          <thead className="sticky top-0 z-20 transition-all duration-300">
            <tr className="bg-[#0B4775] shadow-sm">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={[
                    "px-4 py-3 text-left whitespace-nowrap",
                    "text-white",
                    "text-[13px] font-semibold tracking-wide capitalize",
                    "border-b border-[#0B4775]",
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
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <svg className="animate-spin w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span className="text-[13px] font-medium">Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length > 0 ? (
              <>
                {paddingTop > 0 && (
                  <tr>
                    <td colSpan={columns.length} style={{ height: paddingTop, padding: 0, border: 0 }} />
                  </tr>
                )}
                {virtualItems.map((virtualRow) => {
                  const idx = virtualRow.index;
                  const row = data[idx];

                  // If renderRow is provided, use it for backwards compatibility.
                  // Otherwise, iterate columns and use col.renderCell or row[col.key]
                  if (renderRow) {
                    const rendered = renderRow(row, idx);
                    return React.cloneElement(rendered, {
                      key: row.id || idx,
                      ref: virtualizer.measureElement,
                      'data-index': idx
                    });
                  }

                  return (
                    <tr
                      key={row.id || idx}
                      ref={virtualizer.measureElement}
                      data-index={idx}
                      className={`${ROW_HOVER_CLS} ${rowStripeClass(idx)}`}
                    >
                      {columns.map((col, cIdx) => {
                        const cellValue = col.renderCell ? col.renderCell(row, idx) : row[col.key];
                        return (
                          <td
                            key={col.key || cIdx}
                            className={`px-2 sm:px-3 md:px-4 py-3 md:py-4 ${col.hidden ?? ""} ${col.cellClassName ?? ""}`}
                          >
                            {cellValue}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                {paddingBottom > 0 && (
                  <tr>
                    <td colSpan={columns.length} style={{ height: paddingBottom, padding: 0, border: 0 }} />
                  </tr>
                )}
              </>
            ) : (
              // Empty state row spans all columns
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <EmptyState title={emptyMessage} description="" />
                </td>
              </tr>
            )}
          </tbody>
          {renderFooter && renderFooter()}
        </table>
      </div>
      {paginationProps && (
        <div className=" border-t border-gray-200 dark:border-[#2a2d33] bg-white dark:bg-[#1a1d23]">
          <Pagination {...paginationProps} />
        </div>
      )}
    </div>
  );
}
