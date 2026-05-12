import React, { useMemo, useState } from "react";
import ContactModal from "../components/ContactModal";
import SupplyViewModal from "../components/SupplyViewModal";
import Tooltip from "../components/ui/Tooltip";
import SupplyTable from "../components/SupplyTable";
import { AppContext } from "../context";

export default function SupplyPage() {
  const { supplyData, setSupplyData } = React.useContext(AppContext);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  /* Drawer State */
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* Contact Modal State */
  const [contactModalDeal, setContactModalDeal] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  /* Search Filter */
  const filteredData = useMemo(() => {
    let result = supplyData.filter((item) => {
      const q = search.toLowerCase();

      // Status Filter
      if (filter !== "All" && item.status !== filter) {
        return false;
      }

      // Search Filter
      return (
        item.supplier.toLowerCase().includes(q) ||
        item.cargo.toLowerCase().includes(q) ||
        item.destination.toLowerCase().includes(q)
      );
    });

    // Sort by latest date first
    return result.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [search, filter, supplyData]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  /* Dummy Update Function */
  const updateDealStatus = (id, status) => {
    console.log("Updated:", id, status);
  };

  /* Status Badge */
  const getStatusStyle = (status) => {
    switch (status) {
      case "DELIVERED":
        return "bg-emerald-500/10 text-emerald-400";

      case "PENDING":
        return "bg-yellow-500/10 text-yellow-400";

      case "LOADING":
        return "bg-purple-500/10 text-purple-400";

      default:
        return "bg-blue-500/10 text-blue-400";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Toolbar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative w-[340px]">
            <svg
              className="absolute left-3.5 top-2.5 w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by supplier, cargo or destination..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-lg h-10 pl-11 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors shadow-sm"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-lg h-10 pl-4 pr-11 text-sm text-gray-700 dark:text-gray-300 font-medium focus:outline-none focus:border-purple-500 transition-colors cursor-pointer shadow-sm hover:border-gray-300 dark:hover:border-gray-600"
            >
              <option value="All">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="LOADING">Loading</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELIVERED">Delivered</option>
            </select>
            <svg
              className="absolute right-3.5 top-3 w-4 h-4 text-gray-500 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </div>
        </div>

        {/* Add Button */}
        <button
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors shadow-lg active:scale-95 transform whitespace-nowrap flex-shrink-0"
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Supply
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl overflow-hidden shadow-sm transition-colors duration-300">
        <SupplyTable
          items={currentItems}
          getStatusStyle={getStatusStyle}
          onView={(item) => {
            setSelectedDeal(item);
            setIsModalOpen(true);
          }}
          onContact={(item) => {
            setContactModalDeal(item);
            setIsContactModalOpen(true);
          }}
        />

        {/* Footer with Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-[#2a2d33] bg-gray-50/50 dark:bg-[#0c0e12]/30">
          <span className="text-sm text-gray-500 font-medium">
            Total Cargo Supplies:
            <span className="text-gray-700 dark:text-gray-300 ml-1">{filteredData.length}</span>
          </span>

          <div className="flex gap-2">
            <button
              disabled={currentPage === 1 || filteredData.length === 0}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-4 py-2 border border-gray-200 dark:border-[#2a2d33] rounded-lg text-sm text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-white/[0.04] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              ← Previous
            </button>
            <button
              disabled={currentPage === totalPages || filteredData.length === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-4 py-2 border border-gray-200 dark:border-[#2a2d33] rounded-lg text-sm text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-white/[0.04] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Modal View */}
      <SupplyViewModal
        deal={selectedDeal}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStatusUpdate={updateDealStatus}
      />

      {/* Contact Modal */}
      <ContactModal
        deal={contactModalDeal}
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </div>
  );
}
