// src/utils/formatters.js

/**
 * Format a number as Indian Rupees.
 * @param {number} amount
 * @returns {string} e.g. "₹1,23,456.00"
 */
export function formatINR(amount) {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-IN', {
    style   : 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format an ISO date string for display.
 * @param {string} dateStr
 * @returns {string} e.g. "08 May 2026"
 */
export function formatDateString(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}
