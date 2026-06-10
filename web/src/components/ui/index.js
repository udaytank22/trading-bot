/**
 * @file index.js  (src/components/ui/index.js)
 * @description Barrel export file for all shared UI primitives.
 *
 * WHY A BARREL?
 *   Instead of writing individual import paths per file:
 *     import Button from "../components/ui/button";
 *     import SearchBar from "../components/ui/searchBar";
 *     import Pagination from "../components/ui/pagination";
 *
 *   You can write a single, clean destructured import:
 *     import { Button, SearchBar, Pagination, StatusBadge } from '@components/ui';
 *
 * ADDING A NEW UI COMPONENT:
 *   1. Create the .jsx file in this directory.
 *   2. Add an export line below.
 *   Done — all consumers can immediately import it from '@components/ui'.
 *
 * @author TradeMind Dev Team
 */

// ── Primitive interaction components ───────────────────────────────────────────
export { default as Button } from "./button";
export { default as SearchBar } from "./searchBar";
export { default as Tooltip } from "./tooltip";
export { default as Select } from "./select";
export { default as MultiSelectDropdown } from "./multiSelectDropdown";
export { default as Field } from "./field";
export { default as DatePicker } from "./datePicker";

// ── Data display components ────────────────────────────────────────────────────
export { default as StatusBadge } from "./statusBadge";
export { default as DateCell } from "./dateCell";
export { default as DataTable, rowStripeClass, ROW_HOVER_CLS } from "./dataTable";

// ── Layout / chrome components ─────────────────────────────────────────────────
export { default as PageToolbar } from "./pageToolbar";
export { default as Pagination } from "./pagination";
export { default as EmptyState } from "./emptyState";
export { default as Toast } from "./toast";
export { default as Modal } from "./modal";
export { default as ExcelImportModal } from "./ExcelImportModal";
