/**
 * @file dataTable.test.jsx
 * @description Tests for the shared <DataTable> virtualized table component.
 *
 * Covers:
 *  - Column headers are rendered
 *  - Row data renders via renderRow callback
 *  - Empty state shows when data=[]
 *  - Auto-render mode: renderCell column definitions
 *  - Custom footer via renderFooter
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DataTable, { rowStripeClass, ROW_HOVER_CLS } from '@components/ui/dataTable';

// Mock react-virtual — jsdom has no real layout so the virtualizer returns 0 items.
// We replace the hook with a passthrough that simply renders all items.
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

// ── Fixtures ──────────────────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
];

const DATA = [
  { id: 1, name: 'Alice', status: 'Active' },
  { id: 2, name: 'Bob', status: 'Inactive' },
];

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('DataTable', () => {
  it('renders column headers', () => {
    render(
      <DataTable
        columns={COLUMNS}
        data={DATA}
        renderRow={(row) => (
          <tr key={row.id}>
            <td>{row.id}</td>
            <td>{row.name}</td>
            <td>{row.status}</td>
          </tr>
        )}
      />
    );

    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders all rows when data is provided via renderRow', () => {
    render(
      <DataTable
        columns={COLUMNS}
        data={DATA}
        renderRow={(row) => (
          <tr key={row.id}>
            <td>{row.name}</td>
          </tr>
        )}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows empty state when data is empty', () => {
    render(
      <DataTable
        columns={COLUMNS}
        data={[]}
        emptyMessage="No employees found."
        renderRow={() => null}
      />
    );

    expect(screen.getByText('No employees found.')).toBeInTheDocument();
  });

  it('uses default empty message when none provided', () => {
    render(<DataTable columns={COLUMNS} data={[]} renderRow={() => null} />);
    expect(screen.getByText('No data found.')).toBeInTheDocument();
  });

  it('renders rows in auto-mode using renderCell on column definitions', () => {
    const autoColumns = [
      { key: 'id', label: 'ID' },
      {
        key: 'name',
        label: 'Name',
        renderCell: (row) => <strong>{row.name}</strong>,
      },
    ];

    render(<DataTable columns={autoColumns} data={DATA} />);

    // Both names should appear via renderCell
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    // IDs rendered from row[col.key] fallback
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders custom footer via renderFooter prop', () => {
    render(
      <DataTable
        columns={COLUMNS}
        data={DATA}
        renderRow={(row) => <tr key={row.id}><td>{row.name}</td></tr>}
        renderFooter={() => (
          <tfoot>
            <tr>
              <td colSpan={3}>Total: 2</td>
            </tr>
          </tfoot>
        )}
      />
    );

    expect(screen.getByText('Total: 2')).toBeInTheDocument();
  });

  it('applies hidden class to columns that have a hidden prop', () => {
    const hiddenColumns = [
      { key: 'id', label: 'ID', hidden: 'hidden lg:table-cell' },
      { key: 'name', label: 'Name' },
    ];

    const { container } = render(
      <DataTable
        columns={hiddenColumns}
        data={DATA}
        renderRow={(row) => <tr key={row.id}><td>{row.name}</td></tr>}
      />
    );

    const idHeader = container.querySelector('th:first-child');
    expect(idHeader.className).toContain('hidden lg:table-cell');
  });
});

// ── Helper function tests ─────────────────────────────────────────────────────
describe('rowStripeClass', () => {
  it('returns empty string for even rows', () => {
    expect(rowStripeClass(0)).toBe('');
    expect(rowStripeClass(2)).toBe('');
  });

  it('returns stripe class for odd rows', () => {
    const cls = rowStripeClass(1);
    expect(cls).toContain('bg-gray-50');
    expect(rowStripeClass(3)).toBeTruthy();
  });
});

describe('ROW_HOVER_CLS', () => {
  it('is a non-empty string', () => {
    expect(typeof ROW_HOVER_CLS).toBe('string');
    expect(ROW_HOVER_CLS.length).toBeGreaterThan(0);
  });
});
