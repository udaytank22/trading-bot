import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

const VARIANT_STYLES = {
  form: [
    "bg-white dark:bg-[#0f1117]",
    "border-gray-200 dark:border-[#2a2d33]",
    "rounded-lg px-4 h-[35px] py-0 text-sm",
    "text-gray-900 dark:text-white",
    "hover:bg-gray-50 dark:hover:bg-[#14171c]",
  ].join(" "),
  settings: [
    "bg-white dark:bg-[#0f1117]",
    "border-gray-200 dark:border-[#2a2d36]",
    "rounded-lg h-[36px] px-3 text-[13px]",
    "text-gray-900 dark:text-white",
    "shadow-sm focus:ring-1 focus:ring-purple-500/50",
    "hover:bg-gray-50 dark:hover:bg-[#14171c]",
  ].join(" "),
  toolbar: [
    "bg-white dark:bg-[#1a1d23]",
    "border-gray-200 dark:border-[#2a2d33]",
    "rounded-lg px-3 py-1.5 h-8 text-xs",
    "text-gray-900 dark:text-gray-100",
    "font-medium",
    "hover:bg-gray-50 dark:hover:bg-[#242830]",
    "hover:border-gray-300 dark:hover:border-gray-600",
    "shadow-sm",
  ].join(" "),
};

export default function Select({
  value,
  onChange,
  options = [],
  className = "",
  variant = "toolbar",
  placeholder = "Select...",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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
    if (!isOpen) {
      setSearchTerm("");
      return;
    }

    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);

    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      const clickedDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);
      const clickedMenu = menuRef.current && menuRef.current.contains(event.target);
      if (!clickedDropdown && !clickedMenu) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);
  const hasValue = value !== "" && value !== null && value !== undefined;
  const isPlaceholder = !hasValue;

  const variantCls = VARIANT_STYLES[variant] ?? VARIANT_STYLES.toolbar;
  const itemTextSize = variant === "form" || variant === "settings" ? "text-sm" : "text-xs";

  const baseBtnCls =
    "flex items-center justify-between w-full border focus:outline-none focus:border-purple-500 cursor-pointer transition-colors text-left";

  const filteredOptions = options.filter((opt) =>
    (opt.label || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${baseBtnCls} ${variantCls} ${className}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span
          className={[
            "truncate mr-2",
            isPlaceholder
              ? "text-gray-500 dark:text-gray-400"
              : "text-gray-900 dark:text-white",
          ].join(" ")}
        >
          {isPlaceholder ? placeholder : (selectedOption?.label ?? value)}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
            }}
            className="z-[999999] min-w-[150px] mt-1 bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-lg shadow-lg max-h-[220px] overflow-hidden flex flex-col py-1"
          >
            {/* Search filter input */}
            <div className="px-2 py-1.5 border-b border-gray-100 dark:border-[#2a2d33] flex-shrink-0">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()} // Prevent closing dropdown on click
                className="w-full h-8 px-2.5 text-xs rounded-md bg-gray-50 dark:bg-[#0f1117] border border-gray-200 dark:border-[#2a2d33] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                autoFocus
              />
            </div>

            {/* Options list */}
            <div className="flex-1 overflow-y-auto max-h-[165px]">
              {filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={value === opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={[
                    "w-full text-left px-3 py-2 font-medium transition-colors block truncate",
                    itemTextSize,
                    value === opt.value
                      ? "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"
                      : "text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#242830]",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
              {filteredOptions.length === 0 && (
                <div className="px-3 py-3 text-xs text-gray-400 text-center italic">
                  No matches found
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
