/**
 * @file dataTable.test.jsx
 * @description Unit test suite for DataTable component and helpers.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DataTable, { rowStripeClass, ROW_HOVER_CLS } from '../dataTable';

// Mock react-virtual to avoid window/scroll errors in jsdom
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

const COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
];

const DATA = [
  { id: 1, name: 'Alice', role: 'Dev' },
  { id: 2, name: 'Bob', role: 'Ops' },
];

describe('DataTable', () => {
  it('renders all table headers from columns prop', () => {
    render(
      <DataTable
        columns={COLUMNS}
        data={DATA}
        renderRow={(row) => (
          <tr key={row.id}>
            <td>{row.id}</td>
            <td>{row.name}</td>
            <td>{row.role}</td>
          </tr>
        )}
      />
    );

    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
  });

  it('renders row data using renderRow prop', () => {
    render(
      <DataTable
        columns={COLUMNS}
        data={DATA}
        renderRow={(row) => (
          <tr key={row.id}>
            <td>{row.id}</td>
            <td>{row.name}</td>
            <td>{row.role}</td>
          </tr>
        )}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('displays emptyMessage when data array is empty', () => {
    render(
      <DataTable
        columns={COLUMNS}
        data={[]}
        renderRow={() => null}
        emptyMessage="No employees found."
      />
    );

    expect(screen.getByText('No employees found.')).toBeInTheDocument();
  });

  it('uses default empty message when none provided', () => {
    render(
      <DataTable
        columns={COLUMNS}
        data={[]}
        renderRow={() => null}
      />
    );

    expect(screen.getByText('No data found.')).toBeInTheDocument();
  });

  it('renders rows in auto-mode using renderCell on column definitions', () => {
    const autoColumns = [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Full Name', renderCell: (row) => <strong>{row.name.toUpperCase()}</strong> },
    ];

    render(
      <DataTable
        columns={autoColumns}
        data={DATA}
      />
    );

    expect(screen.getByText('ALICE')).toBeInTheDocument();
    expect(screen.getByText('BOB')).toBeInTheDocument();
  });

  it('renders custom footer via renderFooter prop', () => {
    render(
      <DataTable
        columns={COLUMNS}
        data={DATA}
        renderRow={(row) => <tr key={row.id}><td>{row.name}</td></tr>}
        renderFooter={() => (
          <tfoot>
            <tr><td colSpan={3}>Custom Footer Text</td></tr>
          </tfoot>
        )}
      />
    );

    expect(screen.getByText('Custom Footer Text')).toBeInTheDocument();
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
  it('returns valid background class for rows', () => {
    expect(rowStripeClass(0)).toContain('bg-white');
    expect(rowStripeClass(1)).toContain('bg-white');
  });
});

describe('ROW_HOVER_CLS', () => {
  it('is a non-empty string', () => {
    expect(typeof ROW_HOVER_CLS).toBe('string');
    expect(ROW_HOVER_CLS.length).toBeGreaterThan(0);
  });
});
