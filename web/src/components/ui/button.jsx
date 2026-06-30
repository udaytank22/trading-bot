/**
 * @file Button.jsx
 * @description Centralized, reusable Button component for TradeMind.
 *
 * VARIANTS:
 *  - "primary"   → Purple filled (Add, Save, Submit actions)
 *  - "secondary" → Border-only outline (View, Cancel, secondary actions)
 *  - "danger"    → Red outline (Delete-related actions — rarely used directly; prefer confirmAction)
 *  - "ghost"     → No border, subtle hover (table row action buttons)
 *  - "icon"      → Square icon-only button (edit/delete icons in tables)
 *
 * SIZES:
 *  - "sm"  → Small  (table action buttons, inline controls)
 *  - "md"  → Medium → Default (toolbar buttons)
 *  - "lg"  → Large  (main CTA buttons in modals)
 *
 * USAGE:
 *   <Button variant="primary" size="md" onClick={handleSave}>Save</Button>
 *   <Button variant="icon" color="blue" onClick={() => onEdit(item)} title="Edit">
 *     <EditIcon />
 *   </Button>
 *
 * @author TradeMind Dev Team
 */

import React from "react";

// ─── Variant style maps ────────────────────────────────────────────────────────

/** Maps variant → base Tailwind classes (no size) */
const VARIANT_CLASSES = {
  primary:
    "bg-gradient-to-r from-[#0B4775] to-[#2BA1E8] hover:from-[#093a61] hover:to-[#2289c9] text-white shadow-md active:scale-95 border-transparent transition-all",
  secondary:
    "bg-transparent border border-purple-500/40 text-purple-400 hover:bg-purple-500/10",
  danger:
    "bg-transparent border border-red-500/40 text-red-400 hover:bg-red-500/10",
  ghost:
    "bg-transparent border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/[0.06]",
  icon:
    "bg-transparent border-transparent rounded-xl active:scale-90 shadow-sm",
};

/** Maps size → padding + text classes */
const SIZE_CLASSES = {
  sm: "px-3 py-1.5 text-xs font-bold",
  md: "px-4 py-2 text-sm font-bold",
  lg: "px-6 py-3 text-sm font-bold",
  // Icon buttons use a square pad instead
  icon: "p-2",
};

/**
 * Maps color prop → icon button hover text + bg classes.
 * Only used when variant="icon".
 */
const ICON_COLOR_CLASSES = {
  blue: "text-blue-500/70   hover:text-blue-500   hover:bg-blue-500/10",
  red: "text-red-500/70    hover:text-red-500    hover:bg-red-500/10",
  purple: "text-purple-500/70 hover:text-purple-500 hover:bg-purple-500/10",
  green: "text-emerald-500/70 hover:text-emerald-500 hover:bg-emerald-500/10",
  amber: "text-amber-500/70  hover:text-amber-500  hover:bg-amber-500/10",
  gray: "text-gray-400      hover:text-gray-200   hover:bg-white/[0.06]",
};

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * @param {Object} props
 * @param {"primary"|"secondary"|"danger"|"ghost"|"icon"} [props.variant="primary"] - Visual style
 * @param {"sm"|"md"|"lg"} [props.size="md"] - Button size
 * @param {"blue"|"red"|"purple"|"green"|"amber"|"gray"} [props.color="gray"] - Icon button accent (only for variant="icon")
 * @param {boolean} [props.disabled=false] - Disabled state
 * @param {boolean} [props.loading=false]  - Shows spinner instead of children
 * @param {string}  [props.className]      - Extra classes to merge in
 * @param {React.ReactNode} props.children - Button label or icon
 */
export default function Button({
  variant = "primary",
  size = "sm",
  color = "gray",
  disabled = false,
  loading = false,
  className = "",
  children,
  ...rest
}) {
  // Determine which size key to use for padding
  const sizeKey = variant === "icon" ? "icon" : size;

  // Build class string
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg transition-all whitespace-nowrap flex-shrink-0 focus:outline-none";
  const variantCls =
    variant === "icon"
      ? `${ICON_COLOR_CLASSES[color] ?? ICON_COLOR_CLASSES.gray}`
      : VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary;
  const sizeCls = SIZE_CLASSES[sizeKey] ?? SIZE_CLASSES.md;
  const disabledCls = disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${variantCls} ${sizeCls} ${disabledCls} ${className}`}
      {...rest}
    >
      {/* Spinner shown while loading */}
      {loading ? (
        <svg
          className="animate-spin w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        children
      )}
    </button>
  );
}
