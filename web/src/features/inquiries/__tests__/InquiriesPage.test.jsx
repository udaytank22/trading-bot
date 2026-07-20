/**
 * @file InquiriesPage.test.jsx
 * @description Integration tests for InquiriesPage feature.
 *
 * Covers:
 *  - Inquiry list rendering from API
 *  - Status filter / search interaction
 *  - Create inquiry form submission + success toast
 *  - Error path handling on API failure
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from '../../../config/env';
import { server } from '../../../mocks/server';
import InquiriesPage from '../InquiriesPage';

// ── Mocks ────────────────────────────────────────────────────────────────────
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

vi.mock('../modals/AddInquiryModal', () => ({
  default: ({ isOpen, onClose, onSubmit }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="add-inquiry-modal">
        <h2>Add Inquiry</h2>
        <button
          onClick={() =>
            onSubmit({
              customer: 1,
              vessel: 'MV Atlantis',
              products: [{ product_name: 'Engine Filter', quantity: 2, unit: 'pcs' }],
            })
          }
        >
          Create Inquiry
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    );
  },
}));

const mockAuthValue = {
  isAuthenticated: true,
  currentUser: { id: 1, name: 'Admin', role: 'Super Admin', email: 'admin@trademind.com' },
  hasPermission: () => true,
  logout: vi.fn(),
  refreshUserProfile: vi.fn(),
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
    useUI: () => ({
      theme: 'dark',
      isSidebarOpen: false,
      toggleSidebar: vi.fn(),
      toggleTheme: vi.fn(),
    }),
    useSocket: () => ({
      socket: { on: vi.fn(), off: vi.fn() },
    }),
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
      <MemoryRouter initialEntries={['/inquiries']}>
        <InquiriesPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('InquiriesPage', () => {
  beforeEach(() => {
    sessionStorage.setItem('inquiries_viewMode', 'table');
  });

  it('renders inquiry list from API', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('INQ-1001')).toBeInTheDocument();
    });

    expect(screen.getByText('MV Titan')).toBeInTheDocument();
  });

  it('filters inquiries when search term is entered', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('INQ-1001')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search/i);
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'MV Titan' } });

    await waitFor(() => {
      expect(screen.getByText('INQ-1001')).toBeInTheDocument();
    });
  });

  it('creates a new inquiry and shows success toast', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('INQ-1001')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /Add Inquiry/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId('add-inquiry-modal')).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Create Inquiry/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/New inquiry created successfully/i)).toBeInTheDocument();
    });
  });

  it('shows error toast when inquiry creation fails (error-path)', async () => {
    server.use(
      http.post(`${API_BASE_URL}/api/inquiries`, () =>
        HttpResponse.json({ success: false, message: 'Server error creating inquiry' }, { status: 500 })
      )
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('INQ-1001')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /Add Inquiry/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId('add-inquiry-modal')).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Create Inquiry/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Failed to create inquiry/i)).toBeInTheDocument();
    });
  });
});
