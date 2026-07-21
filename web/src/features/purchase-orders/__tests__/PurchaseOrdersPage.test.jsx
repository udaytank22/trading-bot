/**
 * @file PurchaseOrdersPage.test.jsx
 * @description Integration tests for PurchaseOrdersPage feature.
 *
 * Covers:
 *  - Purchase order list rendering
 *  - Create purchase order happy path
 *  - Error path handling on API failure
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from '../../../config/env';
import { server } from '../../../mocks/server';
import PurchaseOrdersPage from '../PurchaseOrdersPage';

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn(() => Promise.resolve({ isConfirmed: false })),
    mixin: vi.fn(() => ({ fire: vi.fn(() => Promise.resolve({ isConfirmed: false })) })),
  },
}));

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, i) => ({
        index: i, start: i * 50, end: (i + 1) * 50, size: 50, key: i, lane: 0,
      })),
    getTotalSize: () => count * 50,
    measureElement: () => {},
  }),
}));

const mockAuthValue = {
  isAuthenticated: true,
  currentUser: { id: 1, name: 'Admin', role: 'Admin' },
  hasPermission: () => true,
};

vi.mock('@context/AuthContext', () => ({
  useAuth: () => mockAuthValue,
  AuthProvider: ({ children }) => children,
}));

vi.mock('@context', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: () => mockAuthValue,
    useUI: () => ({ theme: 'dark' }),
  };
});

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderPage() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/purchase-orders']}>
        <PurchaseOrdersPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('PurchaseOrdersPage', () => {
  it('renders purchase order list from API', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('ORD-INQ-1001')).toBeInTheDocument();
    });

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('opens create purchase order modal and submits form successfully', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('ORD-INQ-1001')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /Add Purchase Order/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/Create Purchase Order/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Confirm Purchase Order/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Purchase Order Created Successfully/i)).toBeInTheDocument();
    });
  });

  it('shows error toast when purchase order creation fails (error-path)', async () => {
    server.use(
      http.post(`${API_BASE_URL}/api/purchase-orders`, () =>
        HttpResponse.json({ success: false, message: 'PO creation failed' }, { status: 500 })
      )
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('ORD-INQ-1001')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /Add Purchase Order/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/Create Purchase Order/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Confirm Purchase Order/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/An error occurred while saving purchase order/i)).toBeInTheDocument();
    });
  });
});
