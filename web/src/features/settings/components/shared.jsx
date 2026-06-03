import React from 'react';

export function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 dark:text-gray-300 font-medium mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export const inputCls = 'w-full bg-white dark:bg-[#0f1117] border border-gray-200 dark:border-[#2a2d36] rounded-lg h-[36px] px-3 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-all shadow-sm focus:ring-1 focus:ring-purple-500/50';

export function RightDrawer({ isOpen, title, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl max-h-[85vh] bg-white dark:bg-[#1a1d23] shadow-2xl flex flex-col rounded-2xl overflow-hidden border border-gray-200 dark:border-[#2a2d33] animate-fade-in">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2a2d33] flex justify-between items-center bg-gray-50 dark:bg-[#1a1d23]">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg">
            {title}
          </h3>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}

export function CenterModal({ isOpen, title, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[95vw] xl:max-w-[1400px] bg-white dark:bg-[#1a1d23] shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-[#2a2d33]">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2a2d33] flex items-center justify-between bg-gray-50 dark:bg-[#1a1d23]">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-[85vh] overflow-y-auto p-6 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ViewDetails({ item, onClose }) {
  const skipFields = ['id', 'updatedAt', 'deletedAt', 'createdById', 'updatedById'];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {Object.entries(item).map(([key, value]) => {
          // Skip internal or complex relation fields
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) return null;

          // Skip system/audit fields requested by user
          if (skipFields.includes(key)) return null;

          // Change createdAt label to Joined Date
          const label = key === 'createdAt' ? 'Joined Date' : key;

          return (
            <div key={key} className="flex flex-col gap-1 border-b border-gray-50 dark:border-[#2a2d33]/50 pb-2.5">
              <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider pt-0.5">
                {label}
              </span>
              <div className="text-[14px] text-gray-900 dark:text-white font-medium flex flex-wrap gap-1.5">
                {Array.isArray(value) ? (
                  value.length > 0 ? (
                    value.map((v, i) => (
                      <span key={i} className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded text-xs font-semibold border border-purple-500/10">
                        {v}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 italic text-xs">None</span>
                  )
                ) : (
                  typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value ?? '-')
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const EyeIcon = () => <svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
export const EditIcon = () => <svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
export const TrashIcon = () => <svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
