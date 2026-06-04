import React from "react";
import { formatINR } from '@services/marginEngine';
import { DataTable, rowStripeClass, ROW_HOVER_CLS } from '@components/ui';

const VerificationModal = ({ isOpen, onClose, onConfirm, deal, isPageMode }) => {
  const [productSearch, setProductSearch] = React.useState("");

  if (!isOpen || !deal) return null;

  const quote = deal.my_quote;
  const products = quote?.products || [];

  const filteredProducts = products.filter(p => 
    p.product_name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const totalSellerCost = products.reduce((sum, p) => sum + (p.seller_unit_price * (p.quantity || 1)), 0);
  const totalFinalPrice = products.reduce((sum, p) => sum + (p.total_price || 0), 0);
  const totalProfit = totalFinalPrice - totalSellerCost;

  const content = (
    <div className={`${isPageMode ? 'w-full bg-white dark:bg-[#1a1d23] rounded-2xl border border-gray-200 dark:border-[#2a2d33] shadow-sm overflow-hidden' : 'bg-gray-50 dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden'} animate-in zoom-in-95 duration-200`}>
      {!isPageMode && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33] flex justify-between items-center bg-gray-50 dark:bg-[#1a1d23]">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Final Quotation Verification</h2>
              <p className="text-xs text-gray-500 mt-0.5">Review pricing breakdown for {deal.inquiry_id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-xl leading-none">&times;</button>
        </div>
      )}

      <div className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-100 dark:bg-[#0c0e12] p-5 rounded-2xl border border-gray-200 dark:border-[#2a2d33]">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Total Seller Cost</p>
            <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white">{formatINR(totalSellerCost)}</p>
          </div>
          <div className="bg-gray-100 dark:bg-[#0c0e12] p-5 rounded-2xl border border-gray-200 dark:border-[#2a2d33]">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Final Quote Value</p>
            <p className="text-2xl font-mono font-bold text-purple-400">{formatINR(totalFinalPrice)}</p>
          </div>
          <div className="bg-gray-100 dark:bg-[#0c0e12] p-5 rounded-2xl border border-gray-200 dark:border-[#2a2d33]">
            <p className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest mb-2">Estimated Profit</p>
            <p className="text-2xl font-mono font-bold text-emerald-400">{formatINR(totalProfit)}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Line Item Breakdown ({products.length})</h3>
            <input 
              type="text" 
              placeholder="Filter items..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="bg-gray-100 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 w-48"
            />
          </div>
          <div className="border border-gray-200 dark:border-[#2a2d33] rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#0c0e12]">
            <div className={isPageMode ? "" : "max-h-[500px] overflow-y-auto custom-scrollbar"}>
              <DataTable
                columns={[
                  { key: "product", label: "Product" },
                  { key: "basePrice", label: "Base Price" },
                  { key: "marginDisc", label: "Margin/Disc" },
                  { key: "finalUnitPrice", label: "Final Unit Price", className: "text-right" },
                ]}
                data={filteredProducts}
                emptyMessage="No products match your search."
                renderRow={(p, i) => (
                  <tr key={i} className={`${rowStripeClass(i)} ${ROW_HOVER_CLS}`}>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 dark:text-white">{p.product_name}</p>
                      <p className="text-[10px] text-gray-500">{p.quantity} {p.unit}</p>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-400">{formatINR(p.seller_unit_price)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-bold">
                          +{p.margin_percent}%
                        </span>
                        <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded text-[10px] font-bold">
                          -{p.discount_percent}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-gray-900 dark:text-white text-base">
                      {formatINR(p.my_unit_price)}
                    </td>
                  </tr>
                )}
              />
            </div>
          </div>
        </div>

        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-blue-400">Employee Verification Note</p>
            <p className="text-xs text-blue-400/70 mt-1 leading-relaxed">Please ensure all prices are correct before sending the quotation to the client. Once sent, the client will have the option to approve or reject this proposal based on these exact figures.</p>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-gray-200 dark:border-[#2a2d33] flex gap-4 bg-gray-50 dark:bg-[#1a1d23] mt-8">
        <button onClick={onClose} className="px-8 py-3 rounded-xl border border-gray-200 dark:border-[#2a2d33] text-gray-400 text-sm font-bold hover:bg-white/[0.05] hover:text-white transition-all">
          Cancel
        </button>
        <button
          onClick={() => onConfirm()}
          className="flex-1 px-8 py-3 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Verify & Send Quotation to Client
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

export default VerificationModal;
