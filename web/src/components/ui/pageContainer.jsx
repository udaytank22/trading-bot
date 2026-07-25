import React from 'react';

/**
 * PageContainer provides a uniform container layout for all pages,
 * ensuring consistent margin/padding, scroll behaviour, and header structure.
 */
export default function PageContainer({
  title,
  subtitle,
  children,
  className = '',
  rightSlot,
  ...props
}) {
  return (
    <div
      className={`flex flex-col w-full h-full pb-4 relative overflow-hidden min-w-0 ${className}`}
      {...props}
    >
      {rightSlot && (
        <div className="mb-4 flex flex-row items-center justify-end gap-4">
          <div className="flex-shrink-0">{rightSlot}</div>
        </div>
      )}
      {children}
    </div>
  );
}
