import { describe, it, expect, beforeEach } from 'vitest';
import { getAccessToken, setAccessToken, clearAccessToken } from '../tokenStore';

describe('tokenStore', () => {
  beforeEach(() => {
    clearAccessToken();
  });

  it('initially returns null for access token', () => {
    expect(getAccessToken()).toBeNull();
  });

  it('stores and retrieves access token in memory', () => {
    setAccessToken('mock-jwt-token-123');
    expect(getAccessToken()).toBe('mock-jwt-token-123');
  });

  it('clears access token from memory', () => {
    setAccessToken('mock-jwt-token-123');
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });
});
