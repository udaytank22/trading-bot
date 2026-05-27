// src/components/layout/AppShell.jsx
import React, { Suspense } from 'react';
import Sidebar       from './sidebar';
import Topbar        from './topbar';
import CallOverlay   from './callOverlay';
import PageLoader    from '@components/common/PageLoader';
import ErrorBoundary from '@components/common/ErrorBoundary';
import { useUI }     from '@context';

/**
 * AppShell wraps the authenticated layout: sidebar + topbar + scrollable content area.
 * Previously this JSX lived inline inside app.jsx.
 */
export default function AppShell({ children }) {
  const { isSidebarOpen, toggleSidebar } = useUI();

  return (
    <div className="flex w-screen h-screen bg-gray-50 dark:bg-[#0c0e12] text-gray-900 dark:text-white overflow-hidden font-sans transition-colors duration-300">
      <Sidebar isOpen={isSidebarOpen} />
      <main className="flex-1 flex flex-col h-full bg-white dark:bg-[#0f1117] relative overflow-hidden transition-colors duration-300">
        <Topbar onToggleSidebar={toggleSidebar} />
        <CallOverlay />
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-5 custom-scrollbar">
          <div className="w-full min-w-0 h-full mx-auto max-w-[1920px]">
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                {children}
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  );
}
