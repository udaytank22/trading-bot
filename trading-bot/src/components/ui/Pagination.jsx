/**
 * @file Pagination.jsx
 * @description Centralized pagination footer used on all list pages.
 *
 * PROBLEM SOLVED:
 *   Every page (Employees, Accounts, Supply, PO, Inquiries) had its own copy of:
 *     - Showing X–Y of Z label
 *     - Previous / Next buttons
 *     - Disabled state logic
 *   That was ~30 lines of duplicated markup per page.
 *
 * USAGE:
 *   <Pagination
 *     currentPage={currentPage}
 *     totalPages={totalPages}
 *     totalItems={filteredEmployees.length}
 *     itemsPerPage={ITEMS_PER_PAGE}
 *     onPrev={() => setCurrentPage(p => p - 1)}
 *     onNext={() => setCurrentPage(p => p + 1)}
 *     itemLabel="employees"
 *   />
 *
 * @author TradeMind Dev Team
 */

import React from "react";
import Select from "./Select";

/**
 * @param {Object}   props
 * @param {number}   props.currentPage  - Current active page (1-based)
 * @param {number}   props.totalPages   - Total number of pages
 * @param {number}   props.totalItems   - Total filtered item count (for the "Showing X–Y of N" label)
 * @param {number}   props.itemsPerPage - Items per page (for calculating X and Y)
 * @param {function} props.onPrev       - Callback when "Previous" is clicked
 * @param {function} props.onNext       - Callback when "Next" is clicked
 * @param {string}   [props.itemLabel]  - Noun for items, e.g. "employees", "orders" (default "items")
 */
export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPrev,
  onNext,
  itemLabel = "items",
  onItemsPerPageChange,
}) {
  // ── Derived display values ──────────────────────────────────────────────────
  // When there are no items, show "0" instead of negative numbers
  const startShowing =
    totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endShowing = Math.min(currentPage * itemsPerPage, totalItems);

  const isPrevDisabled = currentPage === 1 || totalItems === 0;
  const isNextDisabled = currentPage === totalPages || totalItems === 0;

  // ── Shared button style ─────────────────────────────────────────────────────
  const btnCls = [
    "px-3 py-1",
    "border border-gray-200 dark:border-[#2a2d33]",
    "rounded-lg text-xs font-bold",
    "text-gray-600 dark:text-gray-300",
    "hover:bg-gray-50 dark:hover:bg-white/[0.04]",
    "disabled:opacity-40 disabled:cursor-not-allowed",
    "transition-all",
  ].join(" ");

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-[#2a2d33] bg-gray-50/50 dark:bg-[#0c0e12]/30 select-none">
      {/* ── Left Side: Showing [Dropdown] ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-start gap-1.5">
        <>
          <span className="text-xs text-gray-500 font-medium">Showing</span>
          <Select
            value={itemsPerPage}
            onChange={(val) => onItemsPerPageChange(Number(val))}
            options={[
              { value: 30, label: "30" },
              { value: 50, label: "50" },
              { value: 100, label: "100" }
            ]}
            className="w-16"
          />
        </>
      </div>

      {/* ── Center: Showing X to Y out of Z records ──────────────────────────────── */}
      <div className="flex-1 flex justify-center">
        <span className="text-xs text-gray-500 font-medium text-center">
          Showing{" "}
          <span className="text-gray-700 dark:text-gray-300 font-semibold mx-0.5">
            {startShowing} to {endShowing}
          </span>{" "}
          out of{" "}
          <span className="text-gray-700 dark:text-gray-300 font-semibold mx-0.5">
            {totalItems}
          </span>{" "}
          {itemLabel}
        </span>
      </div>

      {/* ── Right Side: Navigation Buttons ───────────────────────────────────────── */}
      <div className="flex-1 flex justify-end gap-2">
        <button
          disabled={isPrevDisabled}
          onClick={onPrev}
          className={btnCls}
          aria-label="Previous page"
        >
          ← Previous
        </button>
        <button
          disabled={isNextDisabled}
          onClick={onNext}
          className={btnCls}
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
