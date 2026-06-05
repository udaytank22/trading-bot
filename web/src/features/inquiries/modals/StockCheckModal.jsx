import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useData } from '@context';
import { DataTable, rowStripeClass, ROW_HOVER_CLS } from '@components/ui';

// Inline MultiSelect component for vendors using createPortal
const MultiSelectDropdown = ({ options, selectedIds, onChange, placeholder = "Select vendors..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const updateCoords = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updateCoords();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);
      const clickedMenu = menuRef.current && menuRef.current.contains(event.target);
      if (!clickedDropdown && !clickedMenu) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedNames = options
    .filter(opt => selectedIds.includes(opt.id))
    .map(opt => opt.name)
    .join(", ");

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-50 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-lg px-3 py-2 text-xs cursor-pointer flex justify-between items-center min-w-[180px] hover:border-purple-500 transition-colors"
      >
        <span className={`truncate mr-2 ${selectedIds.length === 0 ? 'text-gray-400' : 'text-gray-900 dark:text-white font-medium'}`}>
          {selectedIds.length === 0 ? placeholder : selectedNames}
        </span>
        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: `${coords.top + 4}px`,
            left: `${coords.left}px`,
            width: `${Math.max(coords.width, 220)}px`,
          }}
          className="z-[999999] bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-lg shadow-2xl max-h-[240px] overflow-y-auto py-1 animate-in fade-in duration-100"
        >
          {options.length === 0 ? (
            <div className="px-3 py-3 text-xs text-rose-500 italic font-medium">No matching vendors found for this product.</div>
          ) : (
            options.map(opt => (
              <label key={opt.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-[#242830] cursor-pointer text-xs transition-colors">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(opt.id)}
                  onChange={(e) => {
                    if (e.target.checked) onChange([...selectedIds, opt.id]);
                    else onChange(selectedIds.filter(id => id !== opt.id));
                  }}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-gray-900 dark:text-gray-100 font-bold truncate">{opt.name}</span>
                  <span className="text-[9px] text-gray-500 truncate">{opt.location || opt.address || 'No location'}</span>
                </div>
              </label>
            ))
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

const StockCheckModal = ({ isOpen, onClose, onConfirm, deal, isPageMode }) => {
  const { suppliersData, productsData } = useData();
  const [selections, setSelections] = useState({}); // mapping of product index -> array of supplier IDs
  const [isFullscreen, setIsFullscreen] = useState(false);

  const getProductCategory = (productName) => {
    const prod = (productsData || []).find(p => p.name.toLowerCase() === productName.toLowerCase());
    return prod ? prod.category : 'General';
  };

  const productsAvailability = useMemo(() => {
    if (!deal || !deal.products) return [];

    return deal.products.map(product => {
      const productCategory = getProductCategory(product.product_name);
      const availableSuppliers = suppliersData.filter(s =>
        (s.categories || []).some(cat => cat.toLowerCase() === (productCategory || "").toLowerCase())
      );
      return {
        ...product,
        availableSuppliers
      };
    });
  }, [deal, suppliersData, productsData]);

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
    const selectedSupplierObjects = suppliersData.filter(s => uniqueSelectedSupplierIds.includes(s.id));
    onConfirm(selectedSupplierObjects);
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
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Product Vendor Assignment</h2>
          <p className="text-xs text-gray-500 mt-1">Select the relevant vendors for each product in this inquiry.</p>
        </div>
        <div className="flex items-center gap-3">
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
        />
      </div>

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
