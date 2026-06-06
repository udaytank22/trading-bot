import React from 'react';

export default function EmptyState({ title = "No data found", description = "Try changing your search or filter" }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 dark:bg-[#1a1d23] bg-gray-50/50 rounded-xl min-h-[400px]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-14 h-14 text-gray-300 dark:text-white/10 mb-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
        />
      </svg>
      <h3 className="text-gray-900 dark:text-white text-lg font-bold mb-1.5">
        {title}
      </h3>
      {description && (
        <p className="text-gray-500 text-sm font-medium">
          {description}
        </p>
      )}
    </div>
  );
}
