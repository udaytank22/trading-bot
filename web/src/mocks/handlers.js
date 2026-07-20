// src/mocks/handlers.js
// MSW REST handlers — used by all tests that make API calls

import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from '../config/env';

const BASE = `${API_BASE_URL}/api`;

// ── Shared fixture data ──────────────────────────────────────────────────────
export const MOCK_EMPLOYEES = [
  {
    id: 1,
    fullName: 'Alice Johnson',
    email: 'alice@trademind.com',
    designation: 'Engineer',
    department: 'Tech',
    status: 'ACTIVE',
    joiningDate: '2023-01-15',
  },
  {
    id: 2,
    fullName: 'Bob Smith',
    email: 'bob@trademind.com',
    designation: 'Manager',
    department: 'Ops',
    status: 'INACTIVE',
    joiningDate: '2022-06-01',
  },
];

export const MOCK_CLIENTS = [
  { id: 1, name: 'Acme Corp', email: 'acme@corp.com', company: 'Acme' },
  { id: 2, name: 'Globex', email: 'globex@corp.com', company: 'Globex' },
];

// ── Handlers ─────────────────────────────────────────────────────────────────

export const handlers = [
  // Auth — needed by AuthContext.refreshUserProfile on mount
  http.get(`${BASE}/auth/me`, () =>
    HttpResponse.json({
      success: true,
      data: {
        id: 1,
        email: 'admin@trademind.com',
        role: { name: 'Super Admin', permissions: [] },
        employeeProfile: { fullName: 'Admin User' },
      },
    })
  ),

  // Employees list (paginated)
  http.get(`${BASE}/employees`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const filtered = MOCK_EMPLOYEES.filter(e =>
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
  }),

  // Employee create
  http.post(`${BASE}/employees`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true, data: { id: 99, ...body } });
  }),

  // Employee update
  http.put(`${BASE}/employees/:id`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true, data: body });
  }),

  // Employee delete
  http.delete(`${BASE}/employees/:id`, () =>
    HttpResponse.json({ success: true })
  ),

  // Clients list
  http.get(`${BASE}/clients`, () =>
    HttpResponse.json({ success: true, data: MOCK_CLIENTS })
  ),
];
