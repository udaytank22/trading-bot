import React from "react";

/**
 * @param {Object}   props
 * @param {number}   props.currentPage  - Current active page (1-based)
 * @param {number}   props.totalPages   - Total number of pages
 * @param {number}   props.totalItems   - Total filtered item count (for the "Showing X–Y of N" label)
 * @param {number}   props.itemsPerPage - Items per page (for calculating X and Y)
 * @param {function} props.onPrev       - Callback when "Previous" is clicked
 * @param {function} props.onNext       - Callback when "Next" is clicked
 * @param {function} props.onPageChange - Callback when a specific page number is clicked
 * @param {string}   [props.itemLabel]  - Noun for items, e.g. "employees", "orders" (default "items")
 */
export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPrev,
  onNext,
  onPageChange,
  itemLabel = "items",
}) {
  // When there are no items, show "0" instead of negative numbers
  const startShowing = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endShowing = Math.min(currentPage * itemsPerPage, totalItems);

  const isPrevDisabled = currentPage === 1 || totalItems === 0;
  const isNextDisabled = currentPage === totalPages || totalItems === 0;

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage, '...', totalPages);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[#f4efff]/40 dark:bg-[#0c0e12]/30 select-none border-t border-gray-100 dark:border-[#2a2d33]">
      <div className="text-[13px] text-gray-500 font-medium">
        Showing {startShowing}–{endShowing} of {totalItems} {itemLabel}
      </div>
      
      <div className="flex items-center gap-1.5">
        <button
          disabled={isPrevDisabled}
          onClick={onPrev}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-[#2a2d33] bg-white dark:bg-[#1a1d23] hover:bg-gray-50 dark:hover:bg-white/[0.04] disabled:opacity-40 disabled:cursor-not-allowed transition-all text-gray-500"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm font-bold tracking-widest">
                ...
              </span>
            );
          }
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              onClick={() => onPageChange && onPageChange(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-bold transition-all ${
                isActive 
                  ? "bg-[#8b5cf6] text-white shadow-sm"
                  : "border border-gray-200 dark:border-[#2a2d33] bg-white dark:bg-[#1a1d23] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]"
              }`}
            >
              {p}
            </button>
          );
        })}

        <button
          disabled={isNextDisabled}
          onClick={onNext}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-[#2a2d33] bg-white dark:bg-[#1a1d23] hover:bg-gray-50 dark:hover:bg-white/[0.04] disabled:opacity-40 disabled:cursor-not-allowed transition-all text-gray-500"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
