/**
 * @file factory.test.js
 * @description Unit tests for createResourceApi factory.
 *
 * The factory wraps an Axios instance (apiClient). We mock apiClient so no
 * real network requests are made. Each test verifies the correct HTTP method,
 * URL and payload are used for each CRUD operation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock apiClient BEFORE importing factory ───────────────────────────────────
// We use a module-level vi.mock so the mock is hoisted before any import.
vi.mock('@services/apiClient', () => {
  const apiClient = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    defaults: { headers: { common: {} } },
  };
  return { default: apiClient };
});

import { createResourceApi } from '@services/api/factory';
import apiClient from '@services/apiClient';

// ── Helpers ───────────────────────────────────────────────────────────────────
/** Wrap a value in what Axios normally returns: { data: value } */
const axiosResponse = (data) => Promise.resolve({ data });

describe('createResourceApi', () => {
  let api;

  beforeEach(() => {
    // Create a fresh resource API for /widgets in each test
    api = createResourceApi('/widgets');
    vi.clearAllMocks();
  });

  // ── getAll ────────────────────────────────────────────────────────────────
  describe('getAll', () => {
    it('calls GET on the resource path', async () => {
      const expected = { success: true, data: [{ id: 1, name: 'W1' }] };
      apiClient.get.mockResolvedValue({ data: expected });

      const result = await api.getAll();

      expect(apiClient.get).toHaveBeenCalledWith('/widgets', { params: {} });
      expect(result).toEqual(expected);
    });

    it('forwards query params', async () => {
      apiClient.get.mockResolvedValue({ data: {} });
      await api.getAll({ page: 2, search: 'bolt' });
      expect(apiClient.get).toHaveBeenCalledWith('/widgets', {
        params: { page: 2, search: 'bolt' },
      });
    });
  });

  // ── getById ───────────────────────────────────────────────────────────────
  describe('getById', () => {
    it('calls GET on the resource path with the given id', async () => {
      const expected = { success: true, data: { id: 42, name: 'Widget 42' } };
      apiClient.get.mockResolvedValue({ data: expected });

      const result = await api.getById(42);

      expect(apiClient.get).toHaveBeenCalledWith('/widgets/42');
      expect(result).toEqual(expected);
    });
  });

  // ── create ────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('calls POST on the resource path with the payload', async () => {
      const payload = { name: 'New Widget', qty: 10 };
      const expected = { success: true, data: { id: 5, ...payload } };
      apiClient.post.mockResolvedValue({ data: expected });

      const result = await api.create(payload);

      expect(apiClient.post).toHaveBeenCalledWith('/widgets', payload);
      expect(result).toEqual(expected);
    });
  });

  // ── update ────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('calls PUT on the resource path with id and payload', async () => {
      const payload = { name: 'Updated Widget' };
      const expected = { success: true, data: { id: 7, ...payload } };
      apiClient.put.mockResolvedValue({ data: expected });

      const result = await api.update(7, payload);

      expect(apiClient.put).toHaveBeenCalledWith('/widgets/7', payload);
      expect(result).toEqual(expected);
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('calls DELETE on the resource path with id', async () => {
      const expected = { success: true };
      apiClient.delete.mockResolvedValue({ data: expected });

      const result = await api.remove(3);

      expect(apiClient.delete).toHaveBeenCalledWith('/widgets/3');
      expect(result).toEqual(expected);
    });
  });

  // ── error propagation ─────────────────────────────────────────────────────
  describe('error propagation', () => {
    it('rejects when the underlying axios call fails', async () => {
      const networkError = new Error('Network Error');
      apiClient.get.mockRejectedValue(networkError);

      await expect(api.getAll()).rejects.toThrow('Network Error');
    });
  });
});
