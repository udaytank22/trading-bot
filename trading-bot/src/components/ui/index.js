/**
 * @file index.js  (src/components/ui/index.js)
 * @description Barrel export file for all shared UI primitives.
 *
 * WHY A BARREL?
 *   Instead of writing individual import paths per file:
 *     import Button from "../components/ui/Button";
 *     import SearchBar from "../components/ui/SearchBar";
 *     import Pagination from "../components/ui/Pagination";
 *
 *   You can write a single, clean destructured import:
 *     import { Button, SearchBar, Pagination, StatusBadge } from "../components/ui";
 *
 * ADDING A NEW UI COMPONENT:
 *   1. Create the .jsx file in this directory.
 *   2. Add an export line below.
 *   Done — all consumers can immediately import it from "../components/ui".
 *
 * @author TradeMind Dev Team
 */

// ── Primitive interaction components ───────────────────────────────────────────
export { default as Button }      from "./Button";
export { default as SearchBar }   from "./SearchBar";
export { default as Tooltip }     from "./Tooltip";

// ── Data display components ────────────────────────────────────────────────────
export { default as StatusBadge } from "./StatusBadge";
export { default as DateCell }    from "./DateCell";
export { default as DataTable, rowStripeClass, ROW_HOVER_CLS } from "./DataTable";

// ── Layout / chrome components ─────────────────────────────────────────────────
export { default as PageToolbar } from "./PageToolbar";
export { default as Pagination }  from "./Pagination";
export { default as Toast }       from "./Toast";
