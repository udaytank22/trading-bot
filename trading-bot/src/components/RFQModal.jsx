import React, { useState, useMemo } from "react";
import { mockSuppliers } from "../data/mockSuppliers";

const RFQModal = ({ isOpen, onClose, onSubmit, deal, isPageMode }) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [selectedProductNames, setSelectedProductNames] = useState([]);
  const [stagedRFQs, setStagedRFQs] = useState([]);
  const [productSearch, setProductSearch] = useState("");

  React.useEffect(() => {
    if (deal?.selected_suppliers) {
      const initialStaged = deal.selected_suppliers.map(s => ({
        supplierId: s.id,
        supplierName: s.name,
        products: deal.products.filter(p => 
          s.products.some(sp => sp.toLowerCase() === p.product_name.toLowerCase())
        ).map(p => p.product_name)
      })).filter(rfq => rfq.products.length > 0); // Only stage if there are matches
      
      setStagedRFQs(initialStaged);
    }
  }, [deal?.selected_suppliers]);

  const filteredSuppliers = useMemo(() => {
    if (!deal || !deal.products) return [];
    const inquiryProducts = deal.products.map((p) => p.product_name.toLowerCase());

    return mockSuppliers.filter((supplier) =>
      supplier.products.some((sp) => inquiryProducts.includes(sp.toLowerCase()))
    );
  }, [deal]);

  const filteredProducts = useMemo(() => {
    if (!deal?.products) return [];
    return deal.products.filter(p => 
      p.product_name.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [deal, productSearch]);

  if (!isOpen) return null;

  const handleProductToggle = (name) => {
    setSelectedProductNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleSaveToList = () => {
    if (!selectedSupplierId || selectedProductNames.length === 0) return;

    const supplier = mockSuppliers.find((s) => s.id === selectedSupplierId);
    const newStaged = {
      supplierId: selectedSupplierId,
      supplierName: supplier.name,
      products: selectedProductNames,
    };

    setStagedRFQs((prev) => [...prev, newStaged]);
    setSelectedSupplierId("");
    setSelectedProductNames([]);
  };

  const handleRemoveStaged = (index) => {
    setStagedRFQs((prev) => prev.filter((_, i) => i !== index));
  };

  const [expandedIndices, setExpandedIndices] = useState([]);

  const toggleExpand = (idx) => {
    setExpandedIndices(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const content = (
    <div className={`${isPageMode ? 'w-full bg-white dark:bg-[#1a1d23] rounded-2xl border border-gray-200 dark:border-[#2a2d33] shadow-sm' : 'bg-gray-50 dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden'} animate-in zoom-in-95 duration-200`}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33] flex justify-between items-center bg-gray-50 dark:bg-[#1a1d23]">
        <div className="flex items-center gap-4">
          {isPageMode && (
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          )}
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Prepare RFQs</h2>
        </div>
        {!isPageMode && (
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-xl leading-none">&times;</button>
        )}
      </div>

      <div className="p-6 space-y-8">
        <div className="p-6 bg-gray-100 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-2xl space-y-6">
          <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest">Step 1: Add Party & Products</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                1. Select Party (Supplier)
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                {filteredSuppliers.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSupplierId(s.id)}
                    className={`flex flex-col p-3 rounded-xl border transition-all text-left ${
                      selectedSupplierId === s.id
                        ? "bg-purple-600/10 border-purple-500 text-purple-700 dark:text-white"
                        : "bg-gray-50 dark:bg-[#1a1d23] border-gray-200 dark:border-[#2a2d33] text-gray-700 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500"
                    }`}
                  >
                    <span className="text-sm font-bold">{s.name}</span>
                    <span className="text-[10px] opacity-60">{s.location}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end mb-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  2. Select Products ({selectedProductNames.length} selected)
                </label>
                <input 
                  type="text" 
                  placeholder="Filter products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="bg-gray-50 dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-lg px-3 py-1 text-[10px] text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 w-32"
                />
              </div>
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl max-h-[300px] overflow-y-auto custom-scrollbar">
                {filteredProducts.map((p) => (
                  <button
                    key={p.product_name}
                    onClick={() => handleProductToggle(p.product_name)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${selectedProductNames.includes(p.product_name)
                        ? "bg-purple-600 border-purple-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500"
                      }`}
                  >
                    {p.product_name}
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="text-[10px] text-gray-600 italic py-4 w-full text-center">No products match your search</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveToList}
              disabled={!selectedSupplierId || selectedProductNames.length === 0}
              className="px-8 py-3 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-500 transition-all disabled:opacity-40 flex items-center gap-2 shadow-lg shadow-purple-600/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add to Stage List
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Step 2: Review Staged RFQs ({stagedRFQs.length})</h3>
          <div className="border border-gray-200 dark:border-[#2a2d33] rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#0c0e12]">
            <table className="w-full text-left text-xs border-collapse text-gray-700 dark:text-gray-300">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#1a1d23] border-b border-gray-200 dark:border-[#2a2d33]">
                  <th className="px-6 py-4 text-gray-400 font-bold uppercase tracking-wider">Party / Supplier</th>
                  <th className="px-6 py-4 text-gray-400 font-bold uppercase tracking-wider">Items for RFQ</th>
                  <th className="px-6 py-4 text-right text-gray-400 font-bold uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#2a2d33]">
                {stagedRFQs.length > 0 ? (
                  stagedRFQs.map((rfq, idx) => {
                    const isExpanded = expandedIndices.includes(idx);
                    const productsToShow = isExpanded ? rfq.products : rfq.products.slice(0, 10);
                    
                    return (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 align-top">
                          <span className="text-gray-900 dark:text-white font-bold">{rfq.supplierName}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-xl">
                            {productsToShow.map((p) => (
                              <span key={p} className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-[10px] border border-gray-700">
                                {p}
                              </span>
                            ))}
                            {rfq.products.length > 10 && (
                              <button 
                                onClick={() => toggleExpand(idx)}
                                className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded text-[10px] font-bold hover:bg-purple-500/20 transition-all border border-purple-500/20"
                              >
                                {isExpanded ? "Show Less" : `+${rfq.products.length - 10} more items`}
                              </button>
                            )}
                          </div>
                        </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemoveStaged(idx)}
                          className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center text-gray-600 italic">
                      No RFQs staged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-gray-200 dark:border-[#2a2d33] flex gap-4 bg-gray-50 dark:bg-[#1a1d23] mt-8">
        <button
          type="button"
          onClick={onClose}
          className="px-8 py-3 rounded-xl border border-gray-200 dark:border-[#2a2d33] text-gray-400 text-sm font-bold hover:bg-white/[0.05] hover:text-white transition-all"
        >
          Cancel
        </button>
        <button
          onClick={() => onSubmit(stagedRFQs)}
          disabled={stagedRFQs.length === 0}
          className="flex-1 px-8 py-3 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Confirm & Send {stagedRFQs.length} RFQs
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

export default RFQModal;
