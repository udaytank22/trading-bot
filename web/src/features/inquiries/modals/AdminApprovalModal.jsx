import React, { useState, useEffect } from "react";
import { formatINR } from '@services/marginEngine';
import { DataTable } from '@components/ui';

const AdminApprovalModal = ({ isOpen, onClose, onConfirm, deal, isPageMode, inventoryData = [] }) => {
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
  // Base products from supplier quotes
  const supplierProducts = quote?.products && quote.products.length > 0
    ? quote.products
    : (deal.seller_quote?.products || []).map((sqp, idx) => {
      const dp = deal.products?.[idx] || {};
      return {
        product_name: sqp.product_name,
        supplier_name: sqp.supplier_name || deal.seller_quote?.seller_name || 'N/A',
        quantity: dp.quantity || sqp.moq || 1,
        unit: dp.unit || "pcs",
        seller_unit_price: sqp.seller_unit_price || 0,
        my_unit_price: sqp.seller_unit_price || 0,
        total_price: (sqp.seller_unit_price || 0) * (dp.quantity || sqp.moq || 1)
      };
    });

  // Merge in inventory-sourced products (those in inventoryData that match inquiry items but have no supplier quote)
  const supplierProductNames = new Set(supplierProducts.map(p => p.product_name.toLowerCase()));
  const inventoryProducts = (deal.products || []).reduce((acc, p) => {
    if (supplierProductNames.has(p.product_name.toLowerCase())) return acc; // already covered by supplier quote
    const invMatch = inventoryData.find(inv =>
      inv.itemName.toLowerCase() === p.product_name.toLowerCase() ||
      (inv.sku && p.product_name.toLowerCase().includes(inv.sku.toLowerCase()))
    );
    const invStock = invMatch ? (invMatch.stocks?.reduce((s, st) => s + st.quantity, 0) || 0) : 0;
    if (invMatch && invStock > 0) {
      const costPrice = parseFloat(invMatch.purchasePrice) || 0;
      const sellPrice = parseFloat(invMatch.sellingPrice) || 0;
      const qty = p.quantity || 1;
      acc.push({
        product_name: p.product_name,
        supplier_name: 'Internal Inventory',
        quantity: qty,
        unit: p.unit || invMatch.unit || 'pcs',
        seller_unit_price: costPrice,
        my_unit_price: sellPrice,
        total_price: sellPrice * qty,
        _fromInventory: true,
      });
    }
    return acc;
  }, []);

  const products = [...supplierProducts, ...inventoryProducts];

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
  const profitPct = totalSellerCost > 0 ? (totalProfit / totalSellerCost) * 100 : 0;

  // Collect unique suppliers for the sourcing summary
  const supplierMap = {};
  updatedProducts.forEach(p => {
    const s = p.supplier_name || 'N/A';
    if (!supplierMap[s]) supplierMap[s] = { name: s, items: [], cost: 0 };
    supplierMap[s].items.push(p.product_name);
    supplierMap[s].cost += (p.seller_unit_price || 0) * (p.quantity || 1);
  });
  const suppliers = Object.values(supplierMap);

  // Distinct supplier colors
  const supplierColors = [
    'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  ];
  const supplierColorMap = { 'Internal Inventory': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' };
  suppliers.filter(s => s.name !== 'Internal Inventory').forEach((s, i) => {
    supplierColorMap[s.name] = supplierColors[i % supplierColors.length];
  });

  const content = (
    <div className={`${isPageMode ? 'w-full bg-white dark:bg-[#1a1d23] rounded-2xl border border-gray-200 dark:border-[#2a2d33] shadow-sm overflow-hidden' : 'bg-gray-50 dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden'} animate-in zoom-in-95 duration-200`}>
      {!isPageMode && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33] flex justify-between items-center bg-gray-50 dark:bg-[#1a1d23]">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Admin Approval & Final Review</h2>
            <p className="text-xs text-gray-500 mt-0.5">Review sourcing details, margins & approve for {deal.inquiry_id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-xl leading-none">&times;</button>
        </div>
      )}

      <div className={`p-6 space-y-6 ${isPageMode ? '' : 'max-h-[85vh] overflow-y-auto custom-scrollbar'}`}>

        {/* ── FINANCIAL SUMMARY CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-100 dark:bg-[#0c0e12] p-4 rounded-2xl border border-gray-200 dark:border-[#2a2d33]">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Total Cost</p>
            <p className="text-lg font-mono font-bold text-gray-900 dark:text-white">{formatINR(totalSellerCost)}</p>
          </div>
          <div className="bg-purple-500/5 p-4 rounded-2xl border border-purple-500/20">
            <p className="text-[10px] font-bold text-purple-500/70 uppercase tracking-widest mb-1.5">Final Quote</p>
            <p className="text-lg font-mono font-bold text-purple-400">{formatINR(totalFinalPrice)}</p>
          </div>
          <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20">
            <p className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest mb-1.5">Gross Profit</p>
            <p className={`text-lg font-mono font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatINR(totalProfit)}</p>
          </div>
          <div className="bg-blue-500/5 p-4 rounded-2xl border border-blue-500/20">
            <p className="text-[10px] font-bold text-blue-500/70 uppercase tracking-widest mb-1.5">Margin %</p>
            <p className={`text-lg font-mono font-bold ${profitPct >= 10 ? 'text-blue-400' : 'text-amber-400'}`}>
              {profitPct.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* ── SOURCING PLAN (same as TL_REVIEW Review Margin) ── */}
        <div className="bg-white dark:bg-[#1e2028] rounded-xl border border-gray-200 dark:border-[#2a2d36] overflow-hidden shadow-sm">
          <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100 dark:border-[#2a2d36]">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sourcing Plan (Selected Vendors)</h3>
            {deal.seller_quote?.is_multi_supplier ? (
              <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold rounded">
                Multi-Supplier
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold rounded">
                {deal.seller_quote?.seller_name || 'N/A'}
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <DataTable
              columns={[
                { key: 'index', label: '#', cellClassName: 'px-4 py-3 font-mono text-purple-500 font-bold text-xs w-8', renderCell: (_, i) => i + 1 },
                { key: 'product_name', label: 'Product', cellClassName: 'px-4 py-3', renderCell: (p) => (
                  <>
                    <p className="font-semibold text-gray-900 dark:text-white text-xs">{p.product_name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{p.quantity} {p.unit}</p>
                  </>
                )},
                { key: 'supplier_name', label: 'Sourced From', cellClassName: 'px-4 py-3', renderCell: (p) => {
                  const supplierColor = supplierColorMap[p.supplier_name] || supplierColors[0];
                  return (
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${supplierColor}`}>
                      {p.supplier_name || 'N/A'}
                    </span>
                  );
                }},
                { key: 'quantity', label: 'Qty', cellClassName: 'px-4 py-3 font-mono text-center text-gray-500' },
                { key: 'seller_unit_price', label: 'Cost / Unit', cellClassName: 'px-4 py-3 font-mono text-right text-gray-400', renderCell: (p) => formatINR(p.seller_unit_price) },
                { key: 'my_unit_price', label: 'Sell / Unit', cellClassName: 'px-4 py-3 font-mono text-right font-bold text-purple-400', renderCell: (p) => formatINR(p.my_unit_price) },
                { key: 'total_price', label: 'Total Value', cellClassName: 'px-4 py-3 font-mono text-right font-bold text-gray-900 dark:text-white', renderCell: (p) => formatINR(p.total_price) }
              ]}
              data={filteredProducts}
              emptyMessage="No products."
              renderRow={(p, i) => {
                const supplierColor = supplierColorMap[p.supplier_name] || supplierColors[0];
                return (
                  <tr key={i} className={`border-b border-gray-100 dark:border-[#2a2d33]/50 last:border-0 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/40 dark:bg-[#0c0e12]/30'} hover:bg-purple-500/5`}>
                    <td className="px-4 py-3 font-mono text-purple-500 font-bold text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 dark:text-white text-xs">{p.product_name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{p.quantity} {p.unit}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${supplierColor}`}>
                        {p.supplier_name || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-center text-gray-500">{p.quantity}</td>
                    <td className="px-4 py-3 font-mono text-right text-gray-400">{formatINR(p.seller_unit_price)}</td>
                    <td className="px-4 py-3 font-mono text-right font-bold text-purple-400">{formatINR(p.my_unit_price)}</td>
                    <td className="px-4 py-3 font-mono text-right font-bold text-gray-900 dark:text-white">{formatINR(p.total_price)}</td>
                  </tr>
                );
              }}
              renderFooter={() => (
                <tfoot>
                  <tr className="bg-gray-50 dark:bg-[#0c0e12] border-t-2 border-gray-200 dark:border-[#2a2d33]">
                    <td colSpan={4} className="px-4 py-3 font-bold text-xs text-gray-500 uppercase tracking-wider">Totals</td>
                    <td className="px-4 py-3 font-mono text-right font-bold text-gray-500">{formatINR(totalSellerCost)}</td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3 font-mono text-right font-extrabold text-gray-900 dark:text-white text-sm">{formatINR(totalFinalPrice)}</td>
                  </tr>
                </tfoot>
              )}
            />
          </div>
        </div>

        {/* ── MARGIN & DISCOUNT FROM TL_REVIEW ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-100 dark:bg-[#0c0e12] p-4 rounded-xl border border-gray-200 dark:border-[#2a2d33]">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">TL Set Margin</p>
            <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white">{dealMargin}%</p>
          </div>
          <div className="bg-gray-100 dark:bg-[#0c0e12] p-4 rounded-xl border border-gray-200 dark:border-[#2a2d33]">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">TL Set Discount</p>
            <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white">{dealDiscount}%</p>
          </div>
          {suppliers.length > 0 && (
            <div className="bg-gray-100 dark:bg-[#0c0e12] p-4 rounded-xl border border-gray-200 dark:border-[#2a2d33]">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Suppliers Used</p>
              <div className="flex flex-wrap gap-1.5">
                {suppliers.map(s => (
                  <span key={s.name} className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${supplierColorMap[s.name] || supplierColors[0]}`}>
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── ADMIN OVERRIDE (Optional) ── */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest">Admin Override (Optional)</h3>
            {isOverrideApplied && (
              <span className="ml-auto px-2 py-0.5 bg-amber-400/10 text-amber-400 text-[9px] font-extrabold rounded uppercase tracking-wider">
                Override Active
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Override Margin (%)</label>
              <input
                type="number"
                value={margin}
                onChange={(e) => setMargin(e.target.value)}
                placeholder="e.g. 18"
                className="w-full bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-amber-400 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Override Discount (%)</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="e.g. 5"
                className="w-full bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-amber-400 transition-all"
              />
            </div>
          </div>
          {isOverrideApplied && (
            <p className="text-[10px] text-amber-400/70 mt-3 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Selling prices and totals above have been recalculated with your override values.
            </p>
          )}
        </div>
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div className="p-6 border-t border-gray-200 dark:border-[#2a2d33] flex gap-4 bg-gray-50 dark:bg-[#1a1d23]">
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
