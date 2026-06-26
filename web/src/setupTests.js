import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';

// Inject a fake token so apiClient's request interceptor doesn't reject requests
// with "Authentication token missing" during tests.
beforeAll(() => {
  localStorage.setItem('token', 'test-token-fake');
  server.listen({ onUnhandledRequest: 'warn' });
});

// Reset any runtime handlers after each test
afterEach(() => server.resetHandlers());

// Clean up when all tests finish
afterAll(() => {
  localStorage.removeItem('token');
  server.close();
});
