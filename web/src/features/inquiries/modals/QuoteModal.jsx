import React, { useState, useEffect, useMemo } from "react";
import { parseExcelFile } from '@utils/excelUtils';
import Swal from "sweetalert2";

const QuoteModal = ({ isOpen, onClose, onSubmit, deal, isPageMode }) => {
  const [discount, setDiscount] = useState("");
  const [margin, setMargin] = useState("");
  const [narrative, setNarrative] = useState("");
  const [productPrices, setProductPrices] = useState([]);
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    if (deal?.products) {
      setProductPrices(deal.products.map(p => ({
        ...p,
        my_unit_price: p.my_unit_price || ""
      })));
    }
    if (deal?.margin_percent) setMargin(deal.margin_percent);
    if (deal?.discount_percent) setDiscount(deal.discount_percent);
  }, [deal]);

  const filteredProductPrices = useMemo(() => {
    return productPrices.filter(p => 
      p.product_name.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [productPrices, productSearch]);

  if (!isOpen) return null;

  const isClientQuoting = deal?.status === "CLIENT_QUOTING";
  const isTLReview = deal?.status === "TL_REVIEW";

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await parseExcelFile(file);
      if (data && data.length > 0) {
        const row = data[0];
        if (isTLReview) {
          setDiscount(row.Discount || row.discount || "");
          setMargin(row.Margin || row.margin || "");
        }
        setNarrative(row.Narrative || row.narrative || row.Notes || row.notes || "");
        Swal.fire({
          icon: 'success',
          title: 'Data Imported',
          text: 'Quote details filled from Excel.',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    } catch (error) {
      console.error("Excel parse error:", error);
      Swal.fire({
        icon: 'error',
        title: 'Import Failed',
        text: 'Failed to parse Excel file.',
      });
    }
  };

  const handlePriceChange = (originalIndex, value) => {
    const updated = [...productPrices];
    updated[originalIndex].my_unit_price = value;
    setProductPrices(updated);
  };

  const content = (
    <div className={`${isPageMode ? 'w-full bg-white dark:bg-[#1a1d23] rounded-2xl border border-gray-200 dark:border-[#2a2d33] shadow-sm' : 'bg-gray-50 dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden'} animate-in zoom-in-95 duration-200`}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33] flex justify-between items-center bg-gray-50 dark:bg-[#1a1d23]">
        <div className="flex items-center gap-4">
          {isPageMode && (
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          )}
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {isClientQuoting ? "Coat Item Prices" : isTLReview ? "Set Margin & Discount" : "Send Quote"}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {!isTLReview && (
            <label className="flex items-center gap-2 px-2 py-1 bg-green-600/10 border border-green-500/20 rounded-lg text-green-500 text-[9px] font-bold uppercase tracking-wider cursor-pointer hover:bg-green-600/20 transition-all">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Excel
              <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleExcelUpload} />
            </label>
          )}
          {!isPageMode && (
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-xl leading-none">&times;</button>
          )}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ discount, margin, narrative, products: productPrices });
        }}
        className="p-6 space-y-6"
      >
        {isTLReview && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Base Quoted Prices (Supplier)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
              {deal?.seller_quote?.products?.map((p, idx) => (
                <div key={idx} className="flex flex-col bg-gray-100 dark:bg-[#0c0e12] p-3 rounded-xl border border-gray-200 dark:border-[#2a2d33]">
                  <span className="text-xs text-gray-400 mb-1">{p.product_name}</span>
                  <span className="text-sm font-mono font-bold text-gray-900 dark:text-white">₹ {new Intl.NumberFormat('en-IN').format(p.seller_unit_price || 0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isClientQuoting && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Product Pricing ({productPrices.length})</h3>
              <input 
                type="text" 
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="bg-gray-100 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 w-48"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar p-1">
              {filteredProductPrices.map((p) => {
                const originalIndex = productPrices.findIndex(orig => orig.product_name === p.product_name);
                return (
                  <div key={p.product_name} className="flex items-center gap-4 bg-gray-100 dark:bg-[#0c0e12] p-4 rounded-xl border border-gray-200 dark:border-[#2a2d33]">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{p.product_name}</p>
                      <p className="text-[10px] text-gray-500">{p.quantity} {p.unit}</p>
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        required
                        value={p.my_unit_price}
                        onChange={(e) => handlePriceChange(originalIndex, e.target.value)}
                        className="w-full bg-gray-50 dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isTLReview && (
          <div className="grid grid-cols-2 gap-6 bg-purple-500/5 p-5 rounded-2xl border border-purple-500/10">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Margin (%)</label>
              <input
                type="number"
                value={margin}
                onChange={(e) => setMargin(e.target.value)}
                placeholder="e.g. 15"
                required
                className="w-full bg-gray-100 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Discount (%)</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="e.g. 5"
                required
                className="w-full bg-gray-100 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Narrative / Internal Notes</label>
          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            placeholder="Add any specific details or terms..."
            rows={4}
            required
            className="w-full bg-gray-100 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-all resize-none"
          />
        </div>

        <div className="pt-4 flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3 rounded-xl border border-gray-200 dark:border-[#2a2d33] text-gray-400 text-sm font-bold hover:bg-white/[0.05] hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-8 py-3 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20"
          >
            {isClientQuoting ? "Submit All Prices" : isTLReview ? "Review & Submit for Approval" : "Confirm & Send Quote"}
          </button>
        </div>
      </form>
    </div>
  );

  if (isPageMode) return content;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {content}
    </div>
  );
};

export default QuoteModal;
