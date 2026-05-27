// src/components/common/EmptyState.jsx
import React from 'react';

/**
 * @param {object} props
 * @param {React.ReactNode} props.icon       - SVG icon element
 * @param {string}          props.title      - Bold heading
 * @param {string}          [props.subtitle] - Muted subtitle
 */
export default function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#1a1d23] min-h-[400px]">
      {icon && (
        <div className="w-14 h-14 text-white/10 mb-5">{icon}</div>
      )}
      <h3 className="text-white text-lg font-bold mb-1.5">{title}</h3>
      {subtitle && (
        <p className="text-gray-500 text-sm font-medium">{subtitle}</p>
      )}
    </div>
  );
}
