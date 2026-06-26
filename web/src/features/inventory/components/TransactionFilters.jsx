import React from 'react';

export function TransactionFilters({
  txItemSearch,
  setTxItemSearch,
  txRefNumber,
  setTxRefNumber,
  txTypeFilter,
  setTxTypeFilter,
  txStartDate,
  setTxStartDate,
  txEndDate,
  setTxEndDate
}) {
  return (
    <div className="bg-gray-50 dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d36] rounded-xl p-4 flex flex-col gap-4 shadow-sm transition-colors duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Search Item Name */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Item Name</label>
          <input
            type="text"
            value={txItemSearch}
            onChange={(e) => setTxItemSearch(e.target.value)}
            placeholder="Search item name..."
            className="w-full bg-white dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-xl h-9 px-3 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 shadow-sm"
          />
        </div>

        {/* Search Inquiry Number */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Inquiry #</label>
          <input
            type="text"
            value={txRefNumber}
            onChange={(e) => setTxRefNumber(e.target.value)}
            placeholder="e.g. INQ-1004"
            className="w-full bg-white dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-xl h-9 px-3 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 shadow-sm"
          />
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Transaction Type</label>
          <select
            value={txTypeFilter}
            onChange={(e) => setTxTypeFilter(e.target.value)}
            className="w-full bg-white dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d36] rounded-xl h-9 px-3 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:border-purple-500 shadow-sm cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="IN">IN (Stock Added)</option>
            <option value="OUT">OUT (Stock Removed)</option>
            <option value="INVENTORY_RESERVED">Reserved</option>
            <option value="INVENTORY_DISPATCHED">Dispatched</option>
            <option value="INVENTORY_RELEASED">Released</option>
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Start Date</label>
          <input
            type="date"
            value={txStartDate}
            onChange={(e) => setTxStartDate(e.target.value)}
            className="w-full bg-white dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d36] rounded-xl h-9 px-3 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 shadow-sm"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">End Date</label>
          <input
            type="date"
            value={txEndDate}
            onChange={(e) => setTxEndDate(e.target.value)}
            className="w-full bg-white dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d36] rounded-xl h-9 px-3 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 shadow-sm"
          />
        </div>
      </div>
    </div>
  );
}
