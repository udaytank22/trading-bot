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

export const MOCK_SUPPLIERS = [
  { id: 1, name: 'Apex Marine Supplies', email: 'apex@marine.com' },
  { id: 2, name: 'Oceanic Parts Co', email: 'info@oceanic.com' },
];

export const MOCK_ACCOUNTS = [
  { id: 1, accountName: 'Main Operating Account', bankName: 'HDFC Bank', accountNumber: '1234567890' },
];

export const MOCK_PRODUCTS = [
  { id: 1, name: 'Flange Bolt', code: 'FB-100', price: 50, unit: 'pcs' },
];

export const MOCK_INQUIRIES = [
  {
    id: 1,
    inquiry_id: 'INQ-1001',
    inquiryNumber: 'INQ-1001',
    status: 'PENDING',
    currentStatus: 'PENDING',
    vesselName: 'MV Titan',
    vessel: 'MV Titan',
    vesselReference: 'REF-001',
    buyer_name: 'Acme Corp',
    buyer_email: 'acme@corp.com',
    client: { id: 1, name: 'Acme Corp', company: 'Acme' },
    date_received: '2026-01-15T10:00:00.000Z',
    createdAt: '2026-01-15T10:00:00.000Z',
    items: [{ description: 'High Strength Bolts', quantity: 100, unit: 'pcs' }],
    invoices: [],
  },
  {
    id: 2,
    inquiry_id: 'INQ-1002',
    inquiryNumber: 'INQ-1002',
    status: 'DELIVERED_TO_VESSEL',
    currentStatus: 'DELIVERED_TO_VESSEL',
    vesselName: 'MV Poseidon',
    vessel: 'MV Poseidon',
    vesselReference: 'REF-002',
    buyer_name: 'Globex',
    buyer_email: 'globex@corp.com',
    client: { id: 2, name: 'Globex', company: 'Globex' },
    date_received: '2026-01-20T10:00:00.000Z',
    createdAt: '2026-01-20T10:00:00.000Z',
    items: [{ description: 'Engine Oil Filter', quantity: 5, unit: 'pcs', totalPrice: 500 }],
    invoices: [
      { id: 10, invoiceNumber: 'INV-1002', amount: 500, status: 'PENDING', items: [{ description: 'Engine Oil Filter', totalPrice: 500 }] }
    ],
  },
];

export const MOCK_PURCHASE_ORDERS = [
  {
    id: 1,
    poNumber: 'PO-1001',
    status: 'DRAFT',
    amount: 1500,
    inquiryId: 1,
    inquiry: { inquiryNumber: 'INQ-1001', vesselName: 'MV Titan' },
    client: { name: 'Acme Corp' },
    supplier: { name: 'Apex Marine Supplies' },
    createdAt: '2026-01-15T10:00:00.000Z',
    items: [
      { description: 'High Strength Bolts', quantity: 100, unitPrice: 15, totalPrice: 1500 }
    ],
  },
  {
    id: 2,
    poNumber: 'PO-2002',
    status: 'CONFIRMED',
    amount: 800,
    client: { name: 'Globex' },
    supplier: { name: 'Oceanic Parts Co' },
    createdAt: '2026-01-20T10:00:00.000Z',
    items: [
      { description: 'Engine Oil Filter', quantity: 2, unitPrice: 400, totalPrice: 800 }
    ],
  },
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
        role: { name: 'Admin', permissions: [] },
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

  // Suppliers list
  http.get(`${BASE}/suppliers`, () =>
    HttpResponse.json({ success: true, data: MOCK_SUPPLIERS })
  ),

  // Bank accounts list
  http.get(`${BASE}/bank-accounts`, () =>
    HttpResponse.json({ success: true, data: MOCK_ACCOUNTS })
  ),

  // Products list
  http.get(`${BASE}/products`, () =>
    HttpResponse.json({ success: true, data: MOCK_PRODUCTS })
  ),

  // Inquiries list (paginated)
  http.get(`${BASE}/inquiries`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const statuses = url.searchParams.get('statuses') || '';
    let filtered = [...MOCK_INQUIRIES];

    if (search) {
      filtered = filtered.filter(i =>
        i.inquiryNumber.toLowerCase().includes(search.toLowerCase()) ||
        i.vesselName.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statuses) {
      const statusList = statuses.split(',');
      filtered = filtered.filter(i => statusList.includes(i.currentStatus));
    }

    return HttpResponse.json({
      success: true,
      data: filtered,
      meta: {
        currentPage: 1,
        totalPages: 1,
        totalItems: filtered.length,
        pageSize: 30,
      },
    });
  }),

  // Inquiry single detail
  http.get(`${BASE}/inquiries/:id`, ({ params }) => {
    const inquiry = MOCK_INQUIRIES.find(i => String(i.id) === String(params.id)) || MOCK_INQUIRIES[0];
    return HttpResponse.json({ success: true, data: inquiry });
  }),

  // Inquiry create
  http.post(`${BASE}/inquiries`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: {
        id: 100,
        inquiryNumber: 'INQ-9999',
        currentStatus: 'PENDING',
        ...body,
      },
    });
  }),

  // Inquiry update
  http.put(`${BASE}/inquiries/:id`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true, data: body });
  }),

  // Documents list
  http.get(`${BASE}/documents`, () =>
    HttpResponse.json({ success: true, data: [] })
  ),

  // Invoices list
  http.get(`${BASE}/invoices`, () =>
    HttpResponse.json({
      success: true,
      data: MOCK_INQUIRIES[1].invoices,
      meta: { currentPage: 1, totalPages: 1, totalItems: 1, pageSize: 10 },
    })
  ),

  http.put(`${BASE}/invoices/:id`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true, data: body });
  }),

  http.get(`${BASE}/invoices/:id/pdf`, () =>
    new HttpResponse('PDF_BLOB_CONTENT', {
      headers: { 'Content-Type': 'application/pdf' },
    })
  ),

  http.post(`${BASE}/invoices/:id/send-email`, () =>
    HttpResponse.json({ success: true, message: 'Invoice email sent successfully' })
  ),

  // Payments
  http.post(`${BASE}/payments`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true, data: { id: 1, ...body } });
  }),

  // Purchase Orders list (paginated)
  http.get(`${BASE}/purchase-orders`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    let filtered = [...MOCK_PURCHASE_ORDERS];

    if (search) {
      filtered = filtered.filter(po =>
        po.poNumber.toLowerCase().includes(search.toLowerCase())
      );
    }

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

  // Purchase Order create
  http.post(`${BASE}/purchase-orders`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: {
        id: 200,
        poNumber: 'PO-9999',
        status: 'DRAFT',
        ...body,
      },
    });
  }),

  // Purchase Order update
  http.put(`${BASE}/purchase-orders/:id`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true, data: body });
  }),

  // Purchase Order send email
  http.post(`${BASE}/purchase-orders/:id/send-email`, () =>
    HttpResponse.json({ success: true, message: 'PO email sent successfully' })
  ),
];
