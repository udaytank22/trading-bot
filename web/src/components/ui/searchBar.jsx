/**
 * @file SearchBar.jsx
 * @description Centralized search input with a left-aligned search icon.
 *
 * PROBLEM SOLVED:
 *   Every page (Employees, Accounts, Supply, PO, Documents, Inquiries) had its own
 *   copy of a <div className="relative w-[340px]"> + inline SVG + <input> block.
 *   That was ~20 lines of duplicated markup per page.
 *
 * USAGE:
 *   <SearchBar
 *     value={search}
 *     onChange={setSearch}
 *     placeholder="Search by name or email..."
 *     width="w-[340px]"
 *   />
 *
 * @author TradeMind Dev Team
 */

import React from "react";

/**
 * @param {Object}   props
 * @param {string}   props.value          - Controlled input value
 * @param {function} props.onChange       - Called with new string value (not the event)
 * @param {string}   [props.placeholder]  - Input placeholder text
 * @param {string}   [props.width]        - Tailwind width class, default "w-[340px]"
 * @param {string}   [props.className]    - Extra wrapper classes
 */
export default function SearchBar({
  value,
  onChange,
  onKeyDown,
  placeholder = "Search...",
  width = "w-[340px]",
  className = "",
}) {
  return (
    /* Wrapper is relative so the icon can be positioned inside the input */
    <div className={`relative ${width} ${className}`}>
      {/* Magnifier icon — pointer-events-none so it doesn't capture clicks */}
      <svg
        className="absolute left-3 top-2 w-4 h-4 text-gray-400 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
        />
      </svg>

      {/* Actual input — left-padded to make room for the icon */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={[
          "w-full h-8 pl-9 pr-3",
          "bg-white dark:bg-[#1a1d23]",
          "border border-gray-200 dark:border-[#2a2d33]",
          "rounded-lg text-xs",
          "text-gray-900 dark:text-white placeholder-gray-500",
          "focus:outline-none focus:border-purple-500",
          "transition-colors shadow-sm",
        ].join(" ")}
      />
    </div>
  );
}
