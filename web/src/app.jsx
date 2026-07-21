import React, { Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, UIProvider, SocketProvider, useAuth } from '@context';
import AppShell from '@components/layout/AppShell';
import PageLoader from '@components/common/PageLoader';
import { ErrorBoundary, FeatureErrorBoundary } from '@components/common/ErrorBoundary';
import { PUBLIC_ROUTES, PROTECTED_ROUTES } from '@config/routes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function ProtectedApp() {
  const { isAuthenticated, currentUser, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing && !isAuthenticated) {
    return <PageLoader />;
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (currentUser?.role?.toLowerCase() === 'client' && location.pathname !== '/client-rfqs') {
    return <Navigate to="/client-rfqs" replace />;
  }

  const roleLower = currentUser?.role?.toLowerCase();
  const isAdmin = roleLower === 'admin';
  if (location.pathname === '/settings' && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <AppShell>
      <Routes>
        {PROTECTED_ROUTES.map(({ path, element }) => (
          <Route
            key={path}
            path={path}
            element={
              <FeatureErrorBoundary key={path}>
                {element}
              </FeatureErrorBoundary>
            }
          />
        ))}
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <UIProvider>
            <QueryClientProvider client={queryClient}>
              <HashRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {PUBLIC_ROUTES.map(({ path, element }) => (
                      <Route key={path} path={path} element={element} />
                    ))}
                    <Route path="*" element={<ProtectedApp />} />
                  </Routes>
                </Suspense>
              </HashRouter>
            </QueryClientProvider>
          </UIProvider>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
