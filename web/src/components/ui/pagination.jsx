import React from "react";

/**
 * @param {Object}   props
 * @param {number}   props.currentPage        - Current active page (1-based)
 * @param {number}   props.totalPages         - Total number of pages
 * @param {number}   props.totalItems         - Total filtered item count
 * @param {number}   props.itemsPerPage       - Items per page
 * @param {function} props.onPrev             - Callback when "Previous" is clicked
 * @param {function} props.onNext             - Callback when "Next" is clicked
 * @param {function} props.onPageChange       - Callback when a specific page number is clicked
 * @param {function} props.onItemsPerPageChange- Callback when items per page dropdown is changed
 * @param {string}   [props.itemLabel]        - Noun for items (default "items")
 */
export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 10,
  onPrev,
  onNext,
  onPageChange,
  onItemsPerPageChange,
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
    <div className="flex items-center justify-between px-4 py-3 bg-[#f4efff]/10 dark:bg-[#0c0e12]/10 select-none border-t border-gray-100 dark:border-[#2a2d33]">
      {/* Page Size Dropdown */}
      <div className="flex items-center gap-2.5 text-xs text-gray-500 font-medium">
        <span>Showing</span>
        <div className="relative flex items-center">
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange && onItemsPerPageChange(Number(e.target.value))}
            className="appearance-none bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d36] rounded-xl pl-3 pr-8 h-8 text-xs font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer"
          >
            <option value={5}>05</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Record details */}
      <div className="text-xs text-gray-400 font-semibold">
        Showing {startShowing} to {endShowing} out of {totalItems} records
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-1.5">
        <button
          disabled={isPrevDisabled}
          onClick={onPrev}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs font-bold tracking-wider">
                ...
              </span>
            );
          }
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              onClick={() => onPageChange && onPageChange(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "border border-blue-400 dark:border-blue-500 bg-transparent text-blue-500 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {p}
            </button>
          );
        })}

        <button
          disabled={isNextDisabled}
          onClick={onNext}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
