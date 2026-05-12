import React, {
  useState,
  useEffect,
  useMemo,
  useContext,
  useCallback,
} from "react";
import { AppContext } from "../context";
import StatusBadge from "../components/ui/StatusBadge";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import AddPurchaseOrderModal from "../components/AddPurchaseOrderModal";
import POTable from "../components/POTable";
import PODrawer from "../components/PODrawer";
import POEmailModal from "../components/POEmailModal";

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#1a1d23] min-h-[400px]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-14 h-14 text-white/10 mb-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
        />
      </svg>
      <h3 className="text-white text-lg font-bold mb-1.5">
        No purchase orders found
      </h3>
      <p className="text-gray-500 text-sm font-medium">
        Create your first purchase order to get started
      </p>
    </div>
  );
}

export default function PurchaseOrdersPage() {
  const { purchaseOrdersData, setPurchaseOrdersData } = useContext(AppContext);
  const { toast, showToast } = useToast();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const filteredPOs = useMemo(() => {
    let result = (purchaseOrdersData || []).filter((po) => {
      if (filter !== "All" && po.status !== filter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          po.customer.toLowerCase().includes(q) ||
          po.po_id.toLowerCase().includes(q) ||
          po.vessel.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return result.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [purchaseOrdersData, search, filter]);

  const totalPages = Math.ceil(filteredPOs.length / ITEMS_PER_PAGE);
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPOs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPOs, currentPage]);

  const handleAddPO = (newPO) => {
    const tempPO = {
      ...newPO,
      po_id: `PO-${Date.now()}`,
      status: "PENDING",
      date: new Date().toISOString(),
      total_amount: 0, // Simplified
    };

    setPurchaseOrdersData(prev => [tempPO, ...prev]);
    showToast("Purchase order created successfully", "success");
  };
  
  const updatePOStatus = useCallback((id, status) => {
    setPurchaseOrdersData(prev => 
      prev.map(po => po.po_id === id ? { ...po, status } : po)
    );
    setSelectedPO(prev => 
      prev?.po_id === id ? { ...prev, status } : prev
    );
  }, [setPurchaseOrdersData]);

  const startShowing = filteredPOs.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endShowing = Math.min(currentPage * ITEMS_PER_PAGE, filteredPOs.length);

  return (
    <div className="flex flex-col w-full h-full pb-8 relative">
      <Toast message={toast.message} type={toast.type} />

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4">
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
              placeholder="Search by customer or PO ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-lg h-10 pl-11 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors shadow-sm"
            />
          </div>
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
              <option value="CONFIRMED">Confirmed</option>
              <option value="SHIPPED">Shipped</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        <button
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors shadow-lg active:scale-95 transform whitespace-nowrap flex-shrink-0"
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Purchase Order
        </button>
      </div>

      <div className="flex-1 w-full bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl overflow-hidden flex flex-col shadow-lg transition-colors duration-300">
        {filteredPOs.length > 0 ? (
          <POTable
            items={currentItems}
            onView={(po) => {
              setSelectedPO(po);
              setIsViewDrawerOpen(true);
            }}
            onOrder={(po) => {
              setSelectedPO(po);
              setIsEmailModalOpen(true);
            }}
          />
        ) : (
          <EmptyState />
        )}

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-[#2a2d33] bg-gray-50/50 dark:bg-[#0c0e12]/30 mt-auto">
          <span className="text-sm text-gray-500 font-medium">
            Showing <span className="text-gray-700 dark:text-gray-300 mx-0.5">{startShowing}–{endShowing}</span> of <span className="text-gray-700 dark:text-gray-300 mx-0.5">{filteredPOs.length}</span> orders
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1 || filteredPOs.length === 0}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-4 py-2 border border-gray-200 dark:border-[#2a2d33] rounded-lg text-sm text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-white/[0.04] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              ← Previous
            </button>
            <button
              disabled={currentPage === totalPages || filteredPOs.length === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-4 py-2 border border-gray-200 dark:border-[#2a2d33] rounded-lg text-sm text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-white/[0.04] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      <AddPurchaseOrderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddPO}
      />

      <PODrawer
        po={selectedPO}
        isOpen={isViewDrawerOpen}
        onClose={() => setIsViewDrawerOpen(false)}
      />

      <POEmailModal
        po={selectedPO}
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onStatusUpdate={updatePOStatus}
      />
    </div>
  );
}
