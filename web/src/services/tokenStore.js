/**
 * @file tokenStore.js
 * @description In-memory store for access tokens.
 * Access tokens are kept in module-scoped memory only (never written to disk or localStorage/sessionStorage),
 * ensuring tokens expire automatically when the browser or tab is closed.
 */

let inMemoryAccessToken = null;

/**
 * Retrieves the current in-memory access token.
 * @returns {string|null} The access token or null if not set.
 */
export function getAccessToken() {
  return inMemoryAccessToken;
}

/**
 * Sets the in-memory access token.
 * @param {string|null} token - The access token string.
 */
export function setAccessToken(token) {
  inMemoryAccessToken = token || null;
}

/**
 * Clears the in-memory access token.
 */
export function clearAccessToken() {
  inMemoryAccessToken = null;
}
