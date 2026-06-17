import React, { useState, useMemo } from "react";
import { DataTable, rowStripeClass } from '@components/ui';
import { useData } from '@context';

const RFQModal = ({ isOpen, onClose, onSubmit, deal, isPageMode }) => {
  const { productsData } = useData();
  const [expandedIndices, setExpandedIndices] = useState([]);

  const getProductCategory = (productName) => {
    const prod = (productsData || []).find(p => p.name.toLowerCase() === productName.toLowerCase());
    return prod ? prod.category : 'General';
  };

  const stagedRFQs = useMemo(() => {
    if (deal?.suppliers) {
      return deal.suppliers.map(s => {
        const supplierData = s.supplier || s; // Backend returns nested { supplier: { ... } }
        return {
          supplierId: supplierData.id,
          supplierName: supplierData.name,
          products: deal.products.filter(p => {
            const productCategory = getProductCategory(p.product_name);
            return (supplierData.categories || []).some(cat => cat.toLowerCase() === (productCategory || "").toLowerCase());
          }).map(p => p.product_name)
        };
      }).filter(rfq => rfq.products.length > 0);
    }
    return [];
  }, [deal?.suppliers, deal?.products, productsData]);

  if (!isOpen) return null;

  const toggleExpand = (idx) => {
    setExpandedIndices(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const content = (
    <div className={`${isPageMode ? 'w-full bg-white dark:bg-[#1a1d23] rounded-2xl border border-gray-200 dark:border-[#2a2d33] shadow-sm overflow-hidden' : 'bg-gray-50 dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-2xl shadow-2xl overflow-hidden'} animate-in zoom-in-95 duration-200`}>
      {!isPageMode && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33] flex justify-between items-center bg-gray-50 dark:bg-[#1a1d23]">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Verify RFQ Assignments</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-xl leading-none">&times;</button>
        </div>
      )}

      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please verify the vendors and their assigned products before sending the RFQ emails. This list was automatically generated based on the suppliers you selected in the Stock Check step.
          </p>

          <div className="border border-gray-200 dark:border-[#2a2d33] rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#0c0e12]">
            <DataTable
              columns={[
                { key: 'supplierName', label: 'VENDOR' },
                { key: 'products', label: 'ASSIGNED PRODUCTS' }
              ]}
              data={stagedRFQs}
              emptyMessage="No vendors selected. Please go back to Stock Check."
              renderRow={(rfq, idx) => {
                const isExpanded = expandedIndices.includes(idx);
                const productsToShow = isExpanded ? rfq.products : rfq.products.slice(0, 10);
                return (
                  <tr key={idx} className={`${rowStripeClass(idx)}`}>
                    <td className="px-6 py-4 align-top w-1/3">
                      <span className="text-gray-900 dark:text-white font-bold">{rfq.supplierName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xl">
                        {productsToShow.map((p) => (
                          <span key={p} className="px-2 py-0.5 rounded text-[11px] border border-gray-00">
                            {p}
                          </span>
                        ))}
                        {rfq.products.length > 10 && (
                          <button
                            onClick={() => toggleExpand(idx)}
                            className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded text-[10px] font-bold transition-all border border-purple-500/20 mt-1"
                          >
                            {isExpanded ? "Show Less" : `+${rfq.products.length - 10} more items`}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }}
            />
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-gray-200 dark:border-[#2a2d33] flex gap-4 bg-gray-50 dark:bg-[#1a1d23]">
        <button
          type="button"
          onClick={onClose}
          className="px-8 py-3 rounded-xl border border-gray-200 dark:border-[#2a2d33] text-gray-400 text-sm font-bold transition-all"
        >
          Cancel
        </button>
        <button
          onClick={() => onSubmit(stagedRFQs)}
          disabled={stagedRFQs.length === 0}
          className="flex-1 px-8 py-3 rounded-xl bg-purple-600 text-white text-sm font-bold transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          {stagedRFQs.filter(r => !String(r.supplierId).startsWith('INTERNAL_INV_')).length > 0 
            ? `Verify & Send ${stagedRFQs.filter(r => !String(r.supplierId).startsWith('INTERNAL_INV_')).length} RFQ Emails` 
            : `Confirm Assignments`}
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
