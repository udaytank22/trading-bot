import React from 'react';
import StatusBadge from './statusBadge';
import DateCell from './dateCell';

export const renderStatus = (row, key = 'status') => <StatusBadge status={row[key]} />;

export const renderDate = (row, key = 'date') => <DateCell date={row[key]} />;

export const renderCurrency = (row, key) => {
  const val = parseFloat(row[key]);
  if (isNaN(val)) return '—';
  return `₹ ${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

export const renderBadge = (value, colors = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400') => (
  <span className={`px-2 py-1 rounded text-[11px] font-bold ${colors}`}>
    {value || '-'}
  </span>
);
