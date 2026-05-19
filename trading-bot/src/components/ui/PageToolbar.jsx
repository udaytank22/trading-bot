/**
 * @file PageToolbar.jsx
 * @description Centralized page toolbar that combines SearchBar + StatusFilter
 *              + a primary action button in one consistent layout.
 *
 * PROBLEM SOLVED:
 *   Every list page repeated the same flex layout:
 *     <div className="flex items-center justify-between mb-5">
 *       <div className="flex items-center gap-4">
 *         <SearchBar /> <FilterDropdown />
 *       </div>
 *       <AddButton />
 *     </div>
 *   This was ~30 lines per page, all visually identical but inconsistent.
 *
 * USAGE (simple):
 *   <PageToolbar
 *     search={search}
 *     onSearchChange={setSearch}
 *     searchPlaceholder="Search employees..."
 *     filterValue={filter}
 *     onFilterChange={setFilter}
 *     filterOptions={[{ value: "All", label: "All Status" }, { value: "Active", label: "Active" }]}
 *     onAdd={() => setIsModalOpen(true)}
 *     addLabel="Add Employee"
 *   />
 *
 * USAGE (custom right slot — if you need more than one action button):
 *   <PageToolbar
 *     search={search}
 *     onSearchChange={setSearch}
 *     rightSlot={<><Button>Export</Button><Button>Import</Button></>}
 *   />
 *
 * @author TradeMind Dev Team
 */

import React from "react";
import SearchBar from "./SearchBar";
import Button from "./Button";
import Select from "./Select";

// ─── Icons ─────────────────────────────────────────────────────────────────────
// Inline SVG for the "+" add icon used in the primary button
function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
    </svg>
  );
}

// Dropdown chevron icon
function ChevronIcon() {
  return (
    <svg
      className="absolute right-2.5 top-2 w-3.5 h-3.5 text-gray-500 pointer-events-none"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

// ─── Sub-component: FilterDropdown ─────────────────────────────────────────────

/**
 * Shared filter <select> used across list pages.
 * @param {Array<{value:string, label:string}>} options
 */
function FilterDropdown({ value, onChange, options = [] }) {
  return (
    <Select 
      value={value} 
      onChange={onChange} 
      options={options} 
      className="min-w-[140px]" 
    />
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

/**
 * @param {Object}   props
 * @param {string}   props.search              - Controlled search string
 * @param {function} props.onSearchChange      - Called with new search string
 * @param {string}   [props.searchPlaceholder] - Input placeholder
 * @param {string}   [props.searchWidth]       - Tailwind width, default "w-[340px]"
 * @param {string}   [props.filterValue]       - Current filter value
 * @param {function} [props.onFilterChange]    - Called with new filter value
 * @param {Array}    [props.filterOptions]     - [{value, label}] options; omit to hide filter
 * @param {function} [props.onAdd]             - Callback for primary "Add" button; omit to hide
 * @param {string}   [props.addLabel]          - Label for the add button, default "Add"
 * @param {React.ReactNode} [props.rightSlot]  - Custom slot for the right side (overrides onAdd)
 * @param {string}   [props.className]         - Extra wrapper classes
 */
export default function PageToolbar({
  // Search
  search,
  onSearchChange,
  searchPlaceholder,
  searchWidth,

  // Filter
  filterValue,
  onFilterChange,
  filterOptions,

  // Add button
  onAdd,
  addLabel = "Add",

  // Custom override for right side
  rightSlot,

  className = "",
}) {
  return (
    <div className={`flex items-center justify-between gap-3 mb-3 flex-wrap ${className}`}>

      {/* ── Left: Search + Filter ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">

        {/* Search input */}
        {onSearchChange !== undefined && (
          <SearchBar
            value={search}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            width={searchWidth}
          />
        )}

        {/* Status filter dropdown — only rendered when filterOptions is provided */}
        {filterOptions && onFilterChange && (
          <FilterDropdown
            value={filterValue}
            onChange={onFilterChange}
            options={filterOptions}
          />
        )}
      </div>

      {/* ── Right: Add button or custom slot ──────────────────────────────── */}
      {rightSlot ? (
        rightSlot
      ) : onAdd ? (
        <Button variant="primary" size="md" onClick={onAdd}>
          <PlusIcon />
          {addLabel}
        </Button>
      ) : null}
    </div>
  );
}
