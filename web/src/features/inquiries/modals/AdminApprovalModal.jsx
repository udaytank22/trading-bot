import { AdminApprovalModalSchema1 } from '@config/tableSchemas';
import React, { useState, useEffect } from "react";
import { formatINR } from '@services/marginEngine';
import { DataTable, rowStripeClass, ROW_HOVER_CLS } from '@components/ui';

const AdminApprovalModal = ({ isOpen, onClose, onConfirm, deal, isPageMode }) => {
  const [margin, setMargin] = useState("");
  const [discount, setDiscount] = useState("");
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    if (deal) {
      setMargin(deal.margin_percent !== undefined && deal.margin_percent !== null ? deal.margin_percent.toString() : "");
      setDiscount(deal.discount_percent !== undefined && deal.discount_percent !== null ? deal.discount_percent.toString() : "");
    }
  }, [deal]);

  if (!isOpen || !deal) return null;

  const quote = deal.my_quote;
  const products = quote?.products && quote.products.length > 0
    ? quote.products
    : (deal.seller_quote?.products || []).map((sqp, idx) => {
        const dp = deal.products?.[idx] || {};
        return {
          product_name: sqp.product_name,
          quantity: dp.quantity || 1,
          unit: dp.unit || "pcs",
          seller_unit_price: sqp.seller_unit_price || 0,
          my_unit_price: sqp.seller_unit_price || 0,
          total_price: (sqp.seller_unit_price || 0) * (dp.quantity || 1)
        };
      });

  const marginVal = parseFloat(margin) || 0;
  const discountVal = parseFloat(discount) || 0;

  const dealMargin = parseFloat(deal.margin_percent) || 0;
  const dealDiscount = parseFloat(deal.discount_percent) || 0;
  const isOverrideApplied = marginVal !== dealMargin || discountVal !== dealDiscount;

  const updatedProducts = products.map(p => {
    const cost = p.seller_unit_price || 0;
    let my_unit_price = p.my_unit_price || cost;
    if (isOverrideApplied) {
      my_unit_price = cost * (1 + marginVal / 100) * (1 - discountVal / 100);
    }
    return {
      ...p,
      my_unit_price,
      margin_percent: marginVal,
      discount_percent: discountVal,
      total_price: my_unit_price * (p.quantity || 1)
    };
  });

  const filteredProducts = updatedProducts.filter(p => 
    p.product_name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const totalSellerCost = updatedProducts.reduce((sum, p) => sum + (p.seller_unit_price * (p.quantity || 1)), 0);
  const totalFinalPrice = updatedProducts.reduce((sum, p) => sum + (p.total_price || 0), 0);
  const totalProfit = totalFinalPrice - totalSellerCost;

  const content = (
    <div className={`${isPageMode ? 'w-full bg-white dark:bg-[#1a1d23] rounded-2xl border border-gray-200 dark:border-[#2a2d33] shadow-sm overflow-hidden' : 'bg-gray-50 dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden'} animate-in zoom-in-95 duration-200`}>
      {!isPageMode && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33] flex justify-between items-center bg-gray-50 dark:bg-[#1a1d23]">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Admin Approval & Final Review</h2>
              <p className="text-xs text-gray-500 mt-0.5">Review and adjust margins for {deal.inquiry_id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-xl leading-none">&times;</button>
        </div>
      )}

      <div className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-100 dark:bg-[#0c0e12] p-5 rounded-2xl border border-gray-200 dark:border-[#2a2d33]">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Seller Cost</p>
            <p className="text-xl font-mono font-bold text-gray-900 dark:text-white">{formatINR(totalSellerCost)}</p>
          </div>
          <div className="bg-gray-100 dark:bg-[#0c0e12] p-5 rounded-2xl border border-gray-200 dark:border-[#2a2d33]">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Final Quote</p>
            <p className="text-xl font-mono font-bold text-purple-400">{formatINR(totalFinalPrice)}</p>
          </div>
          <div className="bg-gray-100 dark:bg-[#0c0e12] p-5 rounded-2xl border border-gray-200 dark:border-[#2a2d33]">
            <p className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest mb-2">Profit</p>
            <p className="text-xl font-mono font-bold text-emerald-400">{formatINR(totalProfit)}</p>
          </div>
          <div className="bg-gray-100 dark:bg-[#0c0e12] p-5 rounded-2xl border border-gray-200 dark:border-[#2a2d33]">
            <p className="text-[10px] font-bold text-blue-500/70 uppercase tracking-widest mb-2">Profit %</p>
            <p className="text-xl font-mono font-bold text-blue-400">
              {totalSellerCost > 0 ? ((totalProfit / totalSellerCost) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-6">
          <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4">Admin Adjustments (Global Override)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Override Margin (%)</label>
              <input
                type="number"
                value={margin}
                onChange={(e) => setMargin(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-all shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Override Discount (%)</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-all shadow-inner"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Line Item Details ({products.length})</h3>
            <input 
              type="text" 
              placeholder="Filter products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="bg-gray-100 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 w-48"
            />
          </div>
          <div className="border border-gray-200 dark:border-[#2a2d33] rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#0c0e12]">
            <div className={isPageMode ? "" : "max-h-[400px] overflow-y-auto custom-scrollbar"}>
              <DataTable
                columns={AdminApprovalModalSchema1}
                data={filteredProducts}
                emptyMessage="No products match your search."
                renderRow={(p, i) => (
                  <tr key={i} className={`${rowStripeClass(i)} ${ROW_HOVER_CLS}`}>
                    <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{(1 - 1) * 10 + i + 1}</td>
                        <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 dark:text-white">{p.product_name}</p>
                      <p className="text-[10px] text-gray-500">{p.quantity} {p.unit}</p>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-400">{formatINR(p.seller_unit_price)}</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-purple-300">
                      {formatINR(p.my_unit_price)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-gray-900 dark:text-white text-base">
                      {formatINR(p.total_price)}
                    </td>
                  </tr>
                )}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-gray-200 dark:border-[#2a2d33] flex gap-4 bg-gray-50 dark:bg-[#1a1d23] mt-8">
        <button onClick={onClose} className="px-8 py-3 rounded-xl border border-gray-200 dark:border-[#2a2d33] text-gray-400 text-sm font-bold hover:bg-white/[0.05] hover:text-white transition-all">
          Cancel
        </button>
        <button
          onClick={() => onConfirm({ margin_percent: marginVal, discount_percent: discountVal, products: updatedProducts })}
          className="flex-1 px-8 py-3 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Approve & Send to Verification
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

export default AdminApprovalModal;
