import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

export default function MultiSelectDropdown({
  options = [],
  selectedIds = [],
  selectedValues,
  onChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  emptyMessage = "No matching options found."
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const activeSelected = selectedValues !== undefined ? selectedValues : selectedIds;

  const getOptionValue = (opt) => opt.id !== undefined ? opt.id : opt.value;
  const getOptionLabel = (opt) => opt.name !== undefined ? opt.name : opt.label;
  const getOptionSubLabel = (opt) => opt.location !== undefined ? opt.location : (opt.subLabel !== undefined ? opt.subLabel : opt.address);

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

  // Reset search query when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  const selectedCount = activeSelected.length;
  const selectedNames = options.length > 0 && selectedCount === options.length
    ? "All selected"
    : selectedCount > 3
      ? `${selectedCount} selected`
      : options
          .filter(opt => activeSelected.includes(getOptionValue(opt)))
          .map(opt => getOptionLabel(opt))
          .join(", ");

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(opt => {
      const label = (getOptionLabel(opt) || "").toLowerCase();
      const subLabel = (getOptionSubLabel(opt) || "").toLowerCase();
      return label.includes(query) || subLabel.includes(query);
    });
  }, [options, searchQuery]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-50 dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-lg px-3 py-2 text-xs cursor-pointer flex justify-between items-center min-w-[180px] hover:border-purple-500 transition-colors"
      >
        <span className={`truncate mr-2 ${activeSelected.length === 0 ? 'text-gray-400' : 'text-gray-900 dark:text-white font-medium'}`}>
          {activeSelected.length === 0 ? placeholder : selectedNames}
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
          className="z-[999999] bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-lg shadow-2xl flex flex-col max-h-[300px] overflow-hidden py-1 animate-in fade-in duration-100"
        >
          {/* Search Input Container */}
          <div className="p-2 border-b border-gray-100 dark:border-[#2a2d33] bg-gray-50/50 dark:bg-[#1a1d23]">
            <div className="relative flex items-center">
              <svg className="absolute left-2.5 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-md text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 text-gray-400 hover:text-gray-600 dark:hover:text-white text-xs font-bold leading-none"
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* Bulk select actions for filtered options */}
          {filteredOptions.length > 0 && (
            <div className="flex justify-between items-center px-3 py-1.5 border-b border-gray-100 dark:border-[#2a2d33] bg-gray-50/20 text-[10px]">
              <button
                type="button"
                onClick={() => {
                  const filteredVals = filteredOptions.map(opt => getOptionValue(opt));
                  const updated = [...new Set([...activeSelected, ...filteredVals])];
                  onChange(updated);
                }}
                className="text-purple-600 dark:text-purple-400 font-bold hover:underline"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => {
                  const filteredVals = filteredOptions.map(opt => getOptionValue(opt));
                  const updated = activeSelected.filter(val => !filteredVals.includes(val));
                  onChange(updated);
                }}
                className="text-gray-500 dark:text-gray-400 font-bold hover:underline"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Options List Container */}
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-xs text-rose-500 italic font-medium">{emptyMessage}</div>
            ) : (
              filteredOptions.map(opt => {
                const val = getOptionValue(opt);
                const label = getOptionLabel(opt);
                const subLabel = getOptionSubLabel(opt);
                const isChecked = activeSelected.includes(val);

                return (
                  <label key={val} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#242830] cursor-pointer text-xs transition-colors">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) onChange([...activeSelected, val]);
                        else onChange(activeSelected.filter(id => id !== val));
                      }}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-gray-900 dark:text-gray-100 font-bold truncate">{label}</span>
                      {subLabel && (
                        <span className="text-[9px] text-gray-500 truncate">{subLabel}</span>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
