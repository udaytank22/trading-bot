import React from "react";
import { Download } from "lucide-react";
import { DataTable, rowStripeClass, ROW_HOVER_CLS } from "./ui/dataTable";
import { formatINR, formatDateString } from "../services/marginEngine";

const PROFIT_COLUMNS = [
  { key: "sr_no", label: "#", className: "w-10 text-center" },
  { key: "inquiry_id", label: "Inquiry ID" },
  { key: "buyer",      label: "Buyer" },
  { key: "products",   label: "Products" },
  { key: "cost",       label: "Seller Cost", className: "text-right" },
  { key: "price",      label: "My Price",    className: "text-right" },
  { key: "margin",     label: "Margin %",    className: "text-center" },
  { key: "profit",     label: "Profit",      className: "text-right" },
  { key: "date",       label: "Date",        className: "pl-8" },
];

export default function ProfitTable({ deals, totalCost, totalRevenue, totalProfit, marginPercent, onExport }) {
  const renderDealRow = (deal, idx) => {
    const isHighMargin = (deal.margin_percent ?? 0) >= 20;
    
    return (
      <tr key={deal.inquiry_id} className={`h-[64px] ${ROW_HOVER_CLS} ${rowStripeClass(idx)}`}>
        <td className="px-6 text-center text-gray-500 text-sm font-medium">{idx + 1}</td>
        <td className="px-6">
          <div className="flex flex-col">
            <span className="text-gray-900 dark:text-white font-mono text-[13px]">{deal.inquiry_id}</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-tighter">Reference ID</span>
          </div>
        </td>
        <td className="px-6">
          <div className="text-gray-900 dark:text-white font-bold">{deal.buyer_name}</div>
        </td>
        <td className="px-6">
          <div className="flex flex-col max-w-[200px]">
            <span className="text-gray-600 dark:text-gray-300 text-xs font-medium truncate" title={deal.products}>
              {deal.products}
            </span>
            <span className="text-[10px] text-gray-500 font-mono italic">Bulk Shipment</span>
          </div>
        </td>
        <td className="px-6 text-right font-mono text-gray-500 dark:text-gray-400">
          {formatINR(deal.seller_cost)}
        </td>
        <td className="px-6 text-right">
          <div className="font-mono text-gray-900 dark:text-white font-bold">{formatINR(deal.my_price)}</div>
        </td>
        <td className="px-6 text-center">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black font-mono ${
            isHighMargin ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
          }`}>
            {(deal.margin_percent ?? 0).toFixed(1)}%
          </div>
        </td>
        <td className="px-6 text-right">
          <div className="flex flex-col items-end">
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black text-sm">
              +{formatINR(deal.profit)}
            </span>
            <div className="h-1 w-12 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden mt-1">
               <div 
                 className={`h-full rounded-full ${isHighMargin ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                 style={{ width: `${Math.min(deal.margin_percent * 2, 100)}%` }} 
               />
            </div>
          </div>
        </td>
        <td className="px-6 pl-8">
          <div className="text-gray-400 dark:text-gray-500 text-[13px] font-medium">
            {formatDateString(deal.date_closed)}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <section className="bg-white dark:bg-[#161922] border border-gray-200 dark:border-white/10 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl flex-1 transition-all duration-300 min-h-[400px]">
      <div className="flex items-center justify-between px-10 py-6 border-b border-gray-100 dark:border-white/5">
        <div>
          <h2 className="text-gray-900 dark:text-white text-xl font-black tracking-tight">Closed Deals</h2>
          <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest">Historical Performance Log</p>
        </div>
        <button
          onClick={onExport}
          className="px-6 py-2.5 text-xs font-black text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl hover:bg-purple-600 hover:text-white transition-all active:scale-95 flex items-center gap-2"
        >
          <Download size={16} /> Export CSV Report
        </button>
      </div>
      
      <div className="flex-1 min-h-0">
        <DataTable 
          columns={PROFIT_COLUMNS}
          data={deals}
          renderRow={renderDealRow}
          emptyMessage="No closed deals available."
          maxHeight="max-h-[800px]"
        />
      </div>

      {/* Custom Totals Footer */}
      <div className="px-10 py-6 glass-morphism border-t border-gray-100 dark:border-white/10 mt-auto">
         <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_110px_110px_100px_110px_minmax(0,1fr)] items-center">
            <div className="col-span-3 text-right pr-12">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Cumulative Metrics</span>
            </div>
            <div className="text-right font-mono font-bold text-gray-500 px-3 truncate">{formatINR(totalCost)}</div>
            <div className="text-right font-mono font-black text-gray-900 dark:text-white px-3 truncate">{formatINR(totalRevenue)}</div>
            <div className="text-center">
              <span className="inline-block px-2 py-1 bg-purple-500/10 text-purple-500 font-mono font-black text-xs rounded-lg border border-purple-500/20">
                {marginPercent.toFixed(1)}%
              </span>
            </div>
            <div className="text-right">
              <span className="font-mono font-black text-emerald-500 text-xl tracking-tighter">
                {formatINR(totalProfit)}
              </span>
            </div>
            <div />
         </div>
      </div>
    </section>
  );
}
