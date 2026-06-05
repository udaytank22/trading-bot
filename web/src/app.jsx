import React, { Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, UIProvider, DataProvider, SocketProvider, useAuth } from '@context';
import AppShell from '@components/layout/AppShell';
import PageLoader from '@components/common/PageLoader';
import { PUBLIC_ROUTES, PROTECTED_ROUTES } from '@config/routes';

function ProtectedApp() {
  const { isAuthenticated, currentUser } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (currentUser?.role?.toLowerCase() === 'client' && location.pathname !== '/client-rfqs') {
    return <Navigate to="/client-rfqs" replace />;
  }

  const roleLower = currentUser?.role?.toLowerCase();
  const isAdmin = roleLower === 'admin' || roleLower === 'super admin';
  if (location.pathname === '/settings' && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <AppShell>
      <Routes>
        {PROTECTED_ROUTES.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <UIProvider>
          <DataProvider>
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
          </DataProvider>
        </UIProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
