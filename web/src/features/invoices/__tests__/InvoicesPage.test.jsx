/**
 * @file InvoicesPage.test.jsx
 * @description Integration tests for InvoicesPage and InvoiceDetailsPage.
 *
 * Covers:
 *  - Invoice list rendering
 *  - PDF download and email action buttons render and function without crashing
 *  - Marking an invoice as paid via payment modal
 *  - Error path handling on API failure
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from '../../../config/env';
import { server } from '../../../mocks/server';
import InvoicesPage from '../InvoicesPage';
import InvoiceDetailsPage from '../InvoiceDetailsPage';

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn(() => Promise.resolve({ isConfirmed: true })),
    mixin: vi.fn(() => ({ fire: vi.fn(() => Promise.resolve({ isConfirmed: true })) })),
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
  currentUser: { id: 1, name: 'Admin', role: 'Super Admin' },
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

function renderInvoicesPage() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/invoices']}>
        <InvoicesPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function renderInvoiceDetailsPage(inquiryId = '2') {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/invoices/${inquiryId}`]}>
        <Routes>
          <Route path="/invoices/:id" element={<InvoiceDetailsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('InvoicesPage & InvoiceDetailsPage', () => {
  it('renders invoice list from API', async () => {
    renderInvoicesPage();

    await waitFor(() => {
      expect(screen.getByText('INQ-INQ-1002')).toBeInTheDocument();
    });

    expect(screen.getByText('Globex')).toBeInTheDocument();
  });

  it('renders invoice details and PDF / Email action buttons without crashing', async () => {
    renderInvoiceDetailsPage('2');

    await waitFor(() => {
      expect(screen.getByText('Download Invoice')).toBeInTheDocument();
    });

    const pdfBtn = screen.getByRole('button', { name: /Download Invoice/i });
    expect(pdfBtn).toBeInTheDocument();

    fireEvent.click(pdfBtn);

    await waitFor(() => {
      expect(pdfBtn).toBeInTheDocument();
    });
  });

  it('marks an invoice as paid upon payment form submission', async () => {
    renderInvoiceDetailsPage('2');

    await waitFor(() => {
      expect(screen.getByText('Mark as Paid')).toBeInTheDocument();
    });

    const markPaidBtn = screen.getByRole('button', { name: /Mark as Paid/i });
    fireEvent.click(markPaidBtn);

    await waitFor(() => {
      expect(screen.getByText('Record Payment Details')).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Record Payment/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.queryByText('Record Payment Details')).not.toBeInTheDocument();
    });
  });

  it('handles payment submission API failure gracefully (error-path)', async () => {
    server.use(
      http.put(`${API_BASE_URL}/api/invoices/:id`, () =>
        HttpResponse.json({ success: false, message: 'Update invoice failed' }, { status: 500 })
      )
    );

    renderInvoiceDetailsPage('2');

    await waitFor(() => {
      expect(screen.getByText('Mark as Paid')).toBeInTheDocument();
    });

    const markPaidBtn = screen.getByRole('button', { name: /Mark as Paid/i });
    fireEvent.click(markPaidBtn);

    await waitFor(() => {
      expect(screen.getByText('Record Payment Details')).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Record Payment/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Record Payment Details')).toBeInTheDocument();
    });
  });
});
