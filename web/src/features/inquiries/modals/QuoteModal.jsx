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

  const isClientQuoting = deal?.status === "CLIENT_QUOTING";
  const isTLReview = deal?.status === "TL_REVIEW";

  const calculations = useMemo(() => {
    if (!isTLReview || !deal?.seller_quote?.products) return null;

    let totalSellerCost = 0;
    deal.seller_quote.products.forEach((sqp, idx) => {
      const quantity = deal.products?.[idx]?.quantity || 1;
      totalSellerCost += (sqp.seller_unit_price || 0) * quantity;
    });

    const marginVal = parseFloat(margin) || 0;
    const discountVal = parseFloat(discount) || 0;

    const subtotalWithMargin = totalSellerCost * (1 + marginVal / 100);
    const totalFinalPrice = subtotalWithMargin * (1 - discountVal / 100);
    const discountAmount = subtotalWithMargin - totalFinalPrice;
    const totalProfit = totalFinalPrice - totalSellerCost;
    const profitPercent = totalSellerCost > 0 ? (totalProfit / totalSellerCost) * 100 : 0;

    return {
      totalSellerCost,
      subtotalWithMargin,
      discountAmount,
      totalFinalPrice,
      totalProfit,
      profitPercent,
    };
  }, [isTLReview, deal, margin, discount]);

  if (!isOpen) return null;

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
    <div className={`${isPageMode ? 'w-full bg-white dark:bg-[#1a1d23] rounded-2xl border border-gray-200 dark:border-[#2a2d33] shadow-sm overflow-hidden' : 'bg-gray-50 dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden'} animate-in zoom-in-95 duration-200`}>
      {!isPageMode && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33] flex justify-between items-center bg-gray-50 dark:bg-[#1a1d23]">
          <div className="flex items-center gap-4">
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
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-xl leading-none">&times;</button>
          </div>
        </div>
      )}

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
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-1 ${isPageMode ? "" : "max-h-[300px] overflow-y-auto custom-scrollbar"}`}>
              {deal?.seller_quote?.products?.map((p, idx) => {
                const quantity = deal.products?.[idx]?.quantity || 0;
                const unit = deal.products?.[idx]?.unit || "pcs";
                return (
                  <div key={idx} className="flex flex-col bg-gray-100 dark:bg-[#0c0e12] p-3 rounded-xl border border-gray-200 dark:border-[#2a2d33]">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <span className="text-xs text-gray-400 font-medium truncate" title={p.product_name}>{p.product_name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 shrink-0">Qty: {quantity} {unit}</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-gray-900 dark:text-white font-semibold">₹ {new Intl.NumberFormat('en-IN').format(p.seller_unit_price || 0)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isClientQuoting && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Product Pricing ({productPrices.length})</h3>
              <div className="flex items-center gap-2">
                {isPageMode && (
                  <label className="flex items-center gap-2 px-2.5 py-1.5 bg-green-600/10 border border-green-500/20 rounded-lg text-green-500 text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:bg-green-600/20 transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Excel Import
                    <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleExcelUpload} />
                  </label>
                )}
                <input 
                  type="text" 
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="bg-gray-100 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 w-48"
                />
              </div>
            </div>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-1 ${isPageMode ? "" : "max-h-[400px] overflow-y-auto custom-scrollbar"}`}>
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
          <div className="space-y-6">
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

            {calculations && (
              <div className="bg-gray-100 dark:bg-[#0f111a] p-5 rounded-2xl border border-gray-200 dark:border-[#2a2d33] space-y-3.5 shadow-inner">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pricing Calculations Summary</h4>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  <div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 block uppercase tracking-wider">Total Supplier Cost</span>
                    <span className="font-mono text-gray-900 dark:text-white text-sm font-bold block mt-1">
                      ₹ {new Intl.NumberFormat('en-IN').format(Math.round(calculations.totalSellerCost))}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 block uppercase tracking-wider">Subtotal (with Margin)</span>
                    <span className="font-mono text-gray-900 dark:text-white text-sm font-bold block mt-1">
                      ₹ {new Intl.NumberFormat('en-IN').format(Math.round(calculations.subtotalWithMargin))}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 block uppercase tracking-wider">Discount Value ({discount || 0}%)</span>
                    <span className="font-mono text-red-500 text-sm font-bold block mt-1">
                      - ₹ {new Intl.NumberFormat('en-IN').format(Math.round(calculations.discountAmount))}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 block uppercase tracking-wider">Estimated Profit</span>
                    <span className={`font-mono text-sm font-bold block mt-1 ${calculations.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ₹ {new Intl.NumberFormat('en-IN').format(Math.round(calculations.totalProfit))} ({calculations.profitPercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm font-black text-gray-900 dark:text-white border-t border-dashed border-gray-200 dark:border-[#2a2d33] pt-4 mt-2">
                  <span className="uppercase tracking-wider text-[11px] text-gray-600 dark:text-gray-400 font-bold">Final Client Quote Amount</span>
                  <span className="font-mono text-lg font-extrabold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-3.5 py-1.5 rounded-xl border border-purple-500/20 shadow-sm">
                    ₹ {new Intl.NumberFormat('en-IN').format(Math.round(calculations.totalFinalPrice))}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Narrative / Internal Notes</label>
          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            placeholder="Add any specific details or terms..."
            rows={4}
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
