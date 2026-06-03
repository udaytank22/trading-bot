import React, { useState, useMemo } from "react";
import { useData } from '@context';

const StockCheckModal = ({ isOpen, onClose, onConfirm, deal, isPageMode }) => {
  const { suppliersData } = useData();
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);

  const [supplierSearch, setSupplierSearch] = useState("");

  const productsAvailability = useMemo(() => {
    if (!deal || !deal.products) return [];
    
    return deal.products.map(product => {
      const availableSuppliers = suppliersData.filter(s => 
        (s.products || []).some(p => p.toLowerCase() === product.product_name.toLowerCase())
      );
      return {
        ...product,
        availableSuppliers
      };
    });
  }, [deal, suppliersData]);

  const suppliersWithMatchInfo = useMemo(() => {
    return suppliersData.map(s => {
      const matchingProducts = deal?.products?.filter(p => 
        (s.products || []).some(sp => sp.toLowerCase() === p.product_name.toLowerCase())
      ) || [];
      return {
        ...s,
        location: s.address || s.location || '',
        isMatch: matchingProducts.length > 0,
        matchingCount: matchingProducts.length
      };
    }).sort((a, b) => b.isMatch - a.isMatch); // Matches first
  }, [deal, suppliersData]);

  const filteredSuppliers = suppliersWithMatchInfo.filter(s => 
    s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    s.location.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  if (!isOpen) return null;

  const toggleSupplier = (supplier) => {
    setSelectedSuppliers(prev => 
      prev.find(s => s.id === supplier.id)
        ? prev.filter(s => s.id !== supplier.id)
        : [...prev, supplier]
    );
  };

  const content = (
    <div className={`${isPageMode ? 'w-full bg-white dark:bg-[#1a1d23] rounded-2xl border border-gray-200 dark:border-[#2a2d33] shadow-sm overflow-hidden' : 'bg-gray-50 dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden'} animate-in zoom-in-95 duration-200`}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33] flex justify-between items-center bg-gray-50 dark:bg-[#1a1d23]">
        <div className="flex items-center gap-4">
          {isPageMode && (
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          )}
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Stock Availability Check</h2>
        </div>
        {!isPageMode && (
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-xl leading-none">&times;</button>
        )}
      </div>

      <div className="p-6 space-y-8">
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Inquiry Products ({deal?.products?.length})</h3>
          <div className="grid gap-3 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
            {productsAvailability.map((p, idx) => (
              <div key={idx} className="bg-gray-100 dark:bg-[#0c0e12] p-4 rounded-xl border border-gray-200 dark:border-[#2a2d33] flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{p.product_name}</p>
                  <p className="text-[10px] text-gray-500">{p.quantity} {p.unit}</p>
                </div>
                <div className="flex -space-x-2">
                  {p.availableSuppliers.map((s, i) => (
                    <div 
                      key={i} 
                      title={s.name}
                      className="w-8 h-8 rounded-full bg-purple-600 border-2 border-[#0c0e12] flex items-center justify-center text-[10px] font-bold text-white"
                    >
                      {s.name.charAt(0)}
                    </div>
                  ))}
                  {p.availableSuppliers.length === 0 && (
                    <span className="text-[10px] text-rose-500 font-bold uppercase italic">No direct match found</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Select Suppliers to RFQ</h3>
            <input 
              type="text" 
              placeholder="Search suppliers..."
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
              className="bg-gray-100 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 w-48"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar p-1">
            {filteredSuppliers.map((supplier) => (
              <button
                key={supplier.id}
                onClick={() => toggleSupplier(supplier)}
                className={`flex flex-col p-4 rounded-xl border transition-all relative ${
                  selectedSuppliers.find(s => s.id === supplier.id)
                    ? "bg-purple-600/10 border-purple-500 text-purple-700 dark:text-white"
                    : "bg-gray-100 dark:bg-[#0c0e12] border-gray-200 dark:border-[#2a2d33] text-gray-700 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
              >
                <div className="flex items-center gap-3 text-left w-full">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                    selectedSuppliers.find(s => s.id === supplier.id) ? "bg-purple-500 border-purple-500" : "border-gray-600"
                  }`}>
                    {selectedSuppliers.find(s => s.id === supplier.id) && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{supplier.name}</p>
                    <p className="text-[10px] opacity-60 truncate">{supplier.location}</p>
                  </div>
                  {supplier.isMatch && (
                    <div className="bg-emerald-500/10 text-emerald-500 text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-tighter">
                      Match
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5 border-t border-gray-200 dark:border-[#2a2d33] flex gap-3 bg-gray-50 dark:bg-[#1a1d23] mt-6">
        <button onClick={onClose} className="px-6 py-2.5 rounded-lg border border-gray-200 dark:border-gray-200 dark:border-[#2a2d33] text-gray-700 dark:text-gray-300 text-sm font-bold hover:bg-gray-100 dark:hover:bg-white/[0.05]">
          Cancel
        </button>
        <button
          onClick={() => onConfirm(selectedSuppliers)}
          disabled={selectedSuppliers.length === 0}
          className="flex-1 px-4 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/20 disabled:opacity-50"
        >
          Confirm & Save Selection
        </button>
      </div>
    </div>
  );

  if (isPageMode) return content;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {content}
    </div>
  );
};

export default StockCheckModal;
