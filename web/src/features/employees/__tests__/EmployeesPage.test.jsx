/**
 * @file EmployeesPage.test.jsx
 * @description Integration tests for the EmployeesPage feature.
 *
 * Uses MSW (mocked in setupTests.js) to intercept real axios calls, and
 * Testing Library to render the full component tree and assert on the DOM.
 *
 * Covers:
 *  - Employee names appear from API response
 *  - Empty state renders when API returns empty list
 *  - Search bar is rendered and visible
 *  - Search triggers filtered results
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';

import EmployeesPage from '@features/employees/EmployeesPage';
import { server } from '../../../mocks/server';
import { MOCK_EMPLOYEES } from '../../../mocks/handlers';

// ── Mocks for heavy dependencies that aren't relevant to these tests ───────────

// Mock sweetalert2 so confirmAction doesn't open a real browser dialog
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn(() => Promise.resolve({ isConfirmed: false })),
    mixin: vi.fn(() => ({ fire: vi.fn(() => Promise.resolve({ isConfirmed: false })) })),
  },
}));

// Mock @tanstack/react-virtual so virtualizer doesn't need real layout
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, i) => ({
        index: i,
        start: i * 50,
        end: (i + 1) * 50,
        size: 50,
        key: i,
        lane: 0,
      })),
    getTotalSize: () => count * 50,
    measureElement: () => {},
  }),
}));

// ── Providers wrapper ─────────────────────────────────────────────────────────
/**
 * Minimal providers needed by EmployeesPage:
 *  - MemoryRouter (useNavigate / NavLink)
 *  - AuthProvider (useAuth) — we mock it to avoid localStorage / token logic
 *  - UIProvider (useUI) — for theme/sidebar state
 */

// Lightweight mock auth context
vi.mock('@context', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: () => ({
      isAuthenticated: true,
      currentUser: {
        id: 1,
        name: 'Admin',
        role: 'Admin',
        email: 'admin@trademind.com',
        roleData: { name: 'Super Admin', permissions: [] },
      },
      hasPermission: () => true,
      logout: vi.fn(),
      refreshUserProfile: vi.fn(),
    }),
    useUI: () => ({
      theme: 'dark',
      isSidebarOpen: false,
      toggleSidebar: vi.fn(),
      toggleTheme: vi.fn(),
      startCall: vi.fn(),
      endCall: vi.fn(),
      activeCall: null,
    }),
  };
});

// Helper: wrap with just a MemoryRouter (auth is mocked above)
function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/employees']}>
      <EmployeesPage />
    </MemoryRouter>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('EmployeesPage', () => {
  it('renders employee names fetched from the API', async () => {
    renderPage();

    // Wait for async data to load and render
    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
  });

  it('shows empty state when API returns no employees', async () => {
    // Override the handler for this test only
    server.use(
      http.get('http://localhost:5000/api/employees', () =>
        HttpResponse.json({
          success: true,
          data: [],
          meta: { currentPage: 1, totalPages: 0, totalItems: 0, pageSize: 10 },
        })
      )
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/No employees match/i)).toBeInTheDocument();
    });
  });

  it('renders the search bar', async () => {
    renderPage();

    // The search bar should be visible immediately (no async)
    const searchInput = screen.getByPlaceholderText(
      /Search by name, email or role/i
    );
    expect(searchInput).toBeInTheDocument();
  });

  it('filters employees when search term is entered', async () => {
    // Override handler to filter by search query
    server.use(
      http.get('http://localhost:5001/api/employees', ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get('search') || '';
        const filtered = MOCK_EMPLOYEES.filter((e) =>
          e.fullName.toLowerCase().includes(search.toLowerCase())
        );
        return HttpResponse.json({
          success: true,
          data: filtered,
          meta: {
            currentPage: 1,
            totalPages: 1,
            totalItems: filtered.length,
            pageSize: 10,
          },
        });
      })
    );

    renderPage();

    // Wait for initial data
    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    // Type in search bar to filter to just "Alice"
    const searchInput = screen.getByPlaceholderText(
      /Search by name, email or role/i
    );
    fireEvent.change(searchInput, { target: { value: 'Alice' } });

    // After typing, Alice should remain but Bob should be gone
    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });
    expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
  });

  it('renders the status filter dropdown', async () => {
    renderPage();

    // The filter dropdown button should exist (it shows "All Status" placeholder)
    await waitFor(() => {
      expect(screen.getByText('All Status')).toBeInTheDocument();
    });
  });
});
