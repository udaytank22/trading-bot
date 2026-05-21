import React from 'react';

export default function Toast({ message, type = 'success' }) {
  if (!message) return null;

  const icons = {
    success: (
      <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-500/10 flex-shrink-0">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    error: (
      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shadow-sm border border-red-500/10 flex-shrink-0">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    ),
    info: (
      <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-sm border border-blue-500/10 flex-shrink-0">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
  };

  const titles = {
    success: 'Success Notification',
    error: 'System Error',
    info: 'New notification received',
  };

  const barColors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-blue-600',
  };

  return (
    <div 
      className={`fixed top-8 right-8 z-[1000] w-[400px] bg-white dark:bg-[#1a1d23] border border-gray-100 dark:border-white/5 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden transform transition-all duration-500 ease-out ${message ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-12 opacity-0 scale-95 pointer-events-none'}`}
    >
      <div className="p-5 flex gap-5 items-start relative">
        {/* Icon/Avatar Area */}
        {icons[type] || icons.info}

        {/* Text Content */}
        <div className="flex-1 min-w-0 pr-4">
          <h4 className="text-[15px] font-bold text-gray-800 dark:text-white mb-1 tracking-tight leading-none">
            {titles[type] || titles.info}
          </h4>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-snug font-medium line-clamp-2 italic">
            "{message}"
          </p>
        </div>

        {/* Close Button */}
        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress Bar Style Line */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-50 dark:bg-white/5">
        <div 
          className={`h-full ${barColors[type] || barColors.info} animate-progress shadow-[0_-2px_10px_rgba(37,99,235,0.2)]`}
        />
      </div>

      <style>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-progress {
          animation: progress 3s linear forwards;
        }
      `}</style>
    </div>
  );
}
