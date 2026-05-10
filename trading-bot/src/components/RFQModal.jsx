import React, { useState, useMemo } from "react";
import { mockSuppliers } from "../data/mockSuppliers";

const RFQModal = ({ isOpen, onClose, onSubmit, deal }) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [selectedProductNames, setSelectedProductNames] = useState([]);
  const [stagedRFQs, setStagedRFQs] = useState([]);

  const filteredSuppliers = useMemo(() => {
    if (!deal || !deal.products) return [];
    const inquiryProducts = deal.products.map((p) => p.product_name.toLowerCase());

    return mockSuppliers.filter((supplier) =>
      supplier.products.some((sp) => inquiryProducts.includes(sp.toLowerCase()))
    );
  }, [deal]);

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
    // Reset selections for next add
    setSelectedSupplierId("");
    setSelectedProductNames([]);
  };

  const handleRemoveStaged = (index) => {
    setStagedRFQs((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1a1d23] border border-[#2a2d33] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-[#2a2d33] flex justify-between items-center bg-[#1a1d23]">
          <h2 className="text-lg font-bold text-white">Prepare RFQs</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1: Selection Area */}
          <div className="p-5 bg-[#0c0e12] border border-[#2a2d33] rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest">Step 1: Add Party & Products</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Select Party (Supplier)
                </label>
                <div className="relative">
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-[#1a1d23] border border-[#2a2d33] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Choose a supplier...</option>
                    {filteredSuppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.location})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Select Products
                </label>
                <div className="flex flex-wrap gap-2 p-2 bg-[#1a1d23] border border-[#2a2d33] rounded-xl min-h-[46px]">
                  {deal?.products?.map((p) => (
                    <button
                      key={p.product_name}
                      onClick={() => handleProductToggle(p.product_name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        selectedProductNames.includes(p.product_name)
                          ? "bg-purple-600 border-purple-500 text-white"
                          : "bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-500"
                      }`}
                    >
                      {p.product_name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSaveToList}
                disabled={!selectedSupplierId || selectedProductNames.length === 0}
                className="px-6 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-500 transition-all disabled:opacity-40 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Save to RFQ List
              </button>
            </div>
          </div>

          {/* Step 2: Staged RFQs List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Step 2: Review RFQ List ({stagedRFQs.length})</h3>
            <div className="border border-[#2a2d33] rounded-2xl overflow-hidden bg-[#0c0e12]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1a1d23] border-b border-[#2a2d33]">
                    <th className="px-6 py-4 text-gray-400 font-bold uppercase tracking-wider">Party / Supplier</th>
                    <th className="px-6 py-4 text-gray-400 font-bold uppercase tracking-wider">Items for RFQ</th>
                    <th className="px-6 py-4 text-right text-gray-400 font-bold uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2d33]">
                  {stagedRFQs.length > 0 ? (
                    stagedRFQs.map((rfq, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-white font-bold">{rfq.supplierName}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {rfq.products.map((p) => (
                              <span key={p} className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-[10px] border border-gray-700">
                                {p}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleRemoveStaged(idx)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-12 text-center text-gray-600 italic">
                        No RFQs added to the list yet. Use the selection area above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 flex gap-3 border-t border-[#2a2d33]">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-[#2a2d33] text-gray-400 text-sm font-bold hover:bg-white/[0.05] hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSubmit(stagedRFQs);
                onClose();
              }}
              disabled={stagedRFQs.length === 0}
              className="flex-1 px-6 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Confirm & Send All RFQs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RFQModal;
