import '@testing-library/jest-dom';

// Inject mock localStorage for test environment
if (typeof global.localStorage === 'undefined' || !global.localStorage) {
  const mockLocalStorage = {
    store: {},
    getItem(key) {
      return this.store[key] || null;
    },
    setItem(key, value) {
      this.store[key] = String(value);
    },
    removeItem(key) {
      delete this.store[key];
    },
    clear() {
      this.store = {};
    }
  };
  global.localStorage = mockLocalStorage;
  if (typeof window !== 'undefined') {
    window.localStorage = mockLocalStorage;
  }
}

import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';
import { setAccessToken, clearAccessToken } from './services/tokenStore';


// Inject a fake token into in-memory tokenStore so apiClient's request interceptor works during tests.
beforeAll(() => {
  setAccessToken('test-token-fake');
  server.listen({ onUnhandledRequest: 'warn' });
});

// Reset any runtime handlers after each test
afterEach(() => server.resetHandlers());

// Clean up when all tests finish
afterAll(() => {
  clearAccessToken();
  localStorage.removeItem('token');
  server.close();
});
