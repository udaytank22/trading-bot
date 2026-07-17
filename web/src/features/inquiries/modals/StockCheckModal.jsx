import React, { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { useProducts, useSuppliers } from '@hooks/queries';
import { DataTable, rowStripeClass, ROW_HOVER_CLS, MultiSelectDropdown } from '@components/ui';
import { fetchInventory } from '../../../api/inventory';

const StockCheckModal = ({ isOpen, onClose, onConfirm, deal, isPageMode, hideFooter, onSelectionChange }) => {
  const { data: suppliersData = [] } = useSuppliers();
  const { data: productsData = [] } = useProducts();
  const [selections, setSelections] = useState({}); // mapping of product index -> array of supplier IDs
  const [isFullscreen, setIsFullscreen] = useState(false);

  const getProductCategory = (productName) => {
    const prod = (productsData || []).find(p => p.name.toLowerCase() === productName.toLowerCase());
    return prod ? prod.category : 'General';
  };

  const [inventoryData, setInventoryData] = useState([]);

  useEffect(() => {
    fetchInventory().then(res => setInventoryData(res.data || res)).catch(console.error);
  }, []);

  const productsAvailability = useMemo(() => {
    if (!deal || !deal.products) return [];

    return deal.products.map(product => {
      const productCategory = getProductCategory(product.product_name);
      const availableSuppliers = suppliersData.filter(s =>
        (s.categories || []).some(cat => cat.toLowerCase() === (productCategory || "").toLowerCase())
      );

      // Check if product is in internal inventory
      const inventoryMatch = inventoryData.find(inv => 
        inv.itemName.toLowerCase() === product.product_name.toLowerCase() ||
        (inv.impa && product.product_name.toLowerCase().includes(inv.impa.toLowerCase()))
      );

      let inventoryStock = 0;
      if (inventoryMatch) {
        inventoryStock = inventoryMatch.stocks?.reduce((acc, st) => acc + st.quantity, 0) || 0;
        if (inventoryStock > 0) {
          availableSuppliers.unshift({
            id: 'INTERNAL_INV_' + inventoryMatch.id,
            name: `🌟 Internal Inventory (${inventoryStock} in stock)`,
            location: 'Local Warehouse'
          });
        }
      }

      return {
        ...product,
        inventoryStock,
        availableSuppliers
      };
    });
  }, [deal, suppliersData, productsData, inventoryData]);

  if (!isOpen) return null;

  const handleSelectionChange = (productIdx, supplierIds) => {
    setSelections(prev => ({
      ...prev,
      [productIdx]: supplierIds
    }));
  };

  // Compute all unique selected suppliers across all products
  const uniqueSelectedSupplierIds = useMemo(() => {
    const allIds = Object.values(selections).flat();
    return [...new Set(allIds)];
  }, [selections]);

  const handleConfirm = () => {
    const realSuppliers = suppliersData.filter(s => uniqueSelectedSupplierIds.includes(s.id));
    const internalInvIds = uniqueSelectedSupplierIds.filter(id => typeof id === 'string' && String(id).startsWith('INTERNAL_INV_'));
    
    // Reconstruct a pseudo-supplier object for the internal inventory so the next step can read its categories
    const internalInvSuppliers = internalInvIds.map(id => {
      const assignedProductIndices = Object.keys(selections).filter(idx => selections[idx].includes(id));
      const categories = assignedProductIndices.map(idx => getProductCategory(deal.products[idx].product_name));
      return {
        id,
        name: 'Internal Inventory',
        categories: [...new Set(categories)]
      };
    });

    onConfirm([...realSuppliers, ...internalInvSuppliers]);
  };

  // Keep a ref to always have the latest confirm handler
  const confirmRef = useRef(handleConfirm);
  confirmRef.current = handleConfirm;

  const cancelHandler = useCallback(() => {
    setIsFullscreen(false);
    if (!isPageMode) onClose();
  }, [isPageMode, onClose]);

  // Notify parent of selection changes so it can render header buttons
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange({
        vendorCount: uniqueSelectedSupplierIds.length,
        onConfirm: () => confirmRef.current(),
        onCancel: cancelHandler
      });
    }
  }, [uniqueSelectedSupplierIds.length, onSelectionChange, cancelHandler]);

  const handleAutoSelectAll = () => {
    const newSelections = {};
    productsAvailability.forEach((product, idx) => {
      newSelections[idx] = product.availableSuppliers.map(s => s.id);
    });
    setSelections(newSelections);
  };

  const columns = [
    { key: "index", label: "#" },
    { key: "product", label: "Product Requested" },
    { key: "quantity", label: "Quantity" },
    { key: "unit", label: "Unit" },
    { key: "vendors", label: "Select Vendors (RFQ)" }
  ];

  const renderRow = (product, idx) => {
    const selectedIds = selections[idx] || [];
    const options = product.availableSuppliers.map(s => ({
      id: s.id,
      name: s.name,
      location: s.location || s.address
    }));

    return (
      <tr key={idx} className={`${rowStripeClass(idx)} ${ROW_HOVER_CLS}`}>
        <td className="px-4 py-3 w-12 text-center font-mono text-purple-600 dark:text-purple-400 font-bold">
          {idx + 1}
        </td>
        <td className="px-4 py-3">
          <p className="text-sm font-bold text-gray-900 dark:text-white">{product.product_name}</p>
          {product.inventoryStock > 0 && (
            <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
              ✅ Available in Inventory: {product.inventoryStock}
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-sm font-mono font-medium text-gray-800 dark:text-gray-200">
          {product.quantity}
        </td>
        <td className="px-4 py-3 text-xs text-gray-500 font-medium">
          {product.unit}
        </td>
        <td className="px-4 py-2 w-[300px]">
          <MultiSelectDropdown
            options={options}
            selectedIds={selectedIds}
            onChange={(newIds) => handleSelectionChange(idx, newIds)}
            placeholder="Select matching vendors..."
          />
        </td>
      </tr>
    );
  };

  const isManyItems = productsAvailability.length > 10;

  // Container styling adapts based on whether it's fullscreen or embedded/modal
  const containerStyle = isFullscreen
    ? 'fixed inset-0 z-[200] bg-white dark:bg-[#1a1d23] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200'
    : `${isPageMode ? 'w-full bg-white dark:bg-[#1a1d23] rounded-2xl border border-gray-200 dark:border-[#2a2d33] shadow-sm flex flex-col overflow-hidden' : 'bg-gray-50 dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200'} h-[85vh]`;

  const content = (
    <div className={containerStyle}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33] flex justify-between items-center bg-gray-50 dark:bg-[#1a1d23] flex-shrink-0">
        <div className="flex flex-col">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Product Vendor Assignment</h2>
          <p className="text-xs text-gray-500 mt-1">Select the relevant vendors for each product in this inquiry.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAutoSelectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors border border-purple-700 shadow-sm"
            title="Auto-select all matching vendors for all products"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Select All Vendors
          </button>

          {isManyItems && (
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#242830] hover:bg-gray-200 dark:hover:bg-[#2a2d36] text-gray-700 dark:text-gray-300 text-xs font-bold transition-colors border border-gray-200 dark:border-[#2a2d33]"
            >
              {isFullscreen ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                  Exit Fullscreen
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                  Fullscreen
                </>
              )}
            </button>
          )}
          {(!isPageMode || isFullscreen) && (
            <button onClick={() => { setIsFullscreen(false); if (!isPageMode) onClose(); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors text-xl leading-none">&times;</button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-white dark:bg-[#15171c]">
        <DataTable
          columns={columns}
          data={productsAvailability}
          renderRow={renderRow}
          emptyMessage="No products found."
          maxHeight="max-h-full"
          className="h-full"
        />
      </div>

      {!hideFooter && (
        <div className="p-5 border-t border-gray-200 dark:border-[#2a2d33] flex gap-3 bg-gray-50 dark:bg-[#1a1d23] flex-shrink-0">
          <button onClick={() => { setIsFullscreen(false); if (!isPageMode) onClose(); }} className="px-6 py-2.5 rounded-lg border border-gray-200 dark:border-[#2a2d33] text-gray-700 dark:text-gray-300 text-sm font-bold hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors">
            Cancel
          </button>
          <div className="flex-1 flex gap-4 items-center justify-end">
            <span className="text-xs font-semibold text-gray-500">
              {uniqueSelectedSupplierIds.length} total vendors selected
            </span>
            <button
              onClick={handleConfirm}
              disabled={uniqueSelectedSupplierIds.length === 0}
              className="px-6 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/20 disabled:opacity-50"
            >
              Confirm & Save Assignments
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // If in fullscreen mode, we always render an overlay
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        {content}
      </div>
    );
  }

  if (isPageMode) return content;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {content}
    </div>
  );
};

export default StockCheckModal;
