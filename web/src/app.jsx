import React, { Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, UIProvider, DataProvider, useAuth } from '@context';
import AppShell                from '@components/layout/AppShell';
import PageLoader              from '@components/common/PageLoader';
import { PUBLIC_ROUTES, PROTECTED_ROUTES } from '@config/routes';

function ProtectedApp() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

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
    </AuthProvider>
  );
}
