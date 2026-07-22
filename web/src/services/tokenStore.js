/**
 * @file tokenStore.js
 * @description In-memory store for access tokens.
 * Access tokens are kept in module-scoped memory only (never written to disk or localStorage/sessionStorage),
 * ensuring tokens expire automatically when the browser or tab is closed.
 */

let inMemoryAccessToken = null;
try {
  if (typeof localStorage !== 'undefined') {
    inMemoryAccessToken = localStorage.getItem('token') || null;
  }
} catch (e) {
  // Ignore error in non-browser environments
}

/**
 * Retrieves the current access token.
 * @returns {string|null} The access token or null if not set.
 */
export function getAccessToken() {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('token');
    }
  } catch (e) {
    // Ignore error
  }
  return null;
}

/**
 * Sets the access token.
 * @param {string|null} token - The access token string.
 */
export function setAccessToken(token) {
  inMemoryAccessToken = token || null;
  try {
    if (typeof localStorage !== 'undefined') {
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    }
  } catch (e) {
    // Ignore error
  }
}

/**
 * Clears the access token.
 */
export function clearAccessToken() {
  inMemoryAccessToken = null;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
    }
  } catch (e) {
    // Ignore error
  }
}

