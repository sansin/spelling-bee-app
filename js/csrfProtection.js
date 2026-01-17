/**
 * CSRF Protection Module
 * Prevents Cross-Site Request Forgery attacks through token validation
 * 
 * Features:
 * - Generate unique tokens on login
 * - Validate tokens on all state-changing operations
 * - Auto-refresh tokens periodically
 * - Secure token storage in sessionStorage
 * - Token expiration after 1 hour or session end
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    TOKEN_LENGTH: 32,
    TOKEN_EXPIRY_MS: 60 * 60 * 1000, // 1 hour
    TOKEN_REFRESH_MS: 30 * 60 * 1000, // Refresh every 30 minutes
    STORAGE_KEY: 'csrf_token',
    EXPIRY_KEY: 'csrf_token_expiry',
    SESSION_KEY: 'csrf_session_id',
    OPERATIONS: ['login', 'submitAnswer', 'logout', 'deleteData']
  };

  /**
   * Generate cryptographically secure random token
   * Uses Web Crypto API for security
   * @returns {string} 32-character hex token
   */
  function generateToken() {
    const buffer = new Uint8Array(CONFIG.TOKEN_LENGTH);
    crypto.getRandomValues(buffer);
    return Array.from(buffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Create CSRF token on user login
   * Stores token with expiration timestamp
   * @param {string} userId - User ID for token binding
   * @returns {string} Generated CSRF token
   */
  function createToken(userId) {
    if (!userId) {
      console.error('CSRF: Cannot create token without userId');
      return null;
    }

    const token = generateToken();
    const expiryTime = Date.now() + CONFIG.TOKEN_EXPIRY_MS;
    const sessionId = Date.now();

    // Store in sessionStorage (cleared on tab close)
    try {
      sessionStorage.setItem(CONFIG.STORAGE_KEY, token);
      sessionStorage.setItem(CONFIG.EXPIRY_KEY, expiryTime.toString());
      sessionStorage.setItem(CONFIG.SESSION_KEY, sessionId.toString());
      sessionStorage.setItem('csrf_user_id', userId);
      console.log('CSRF: Token created for user:', userId);
      return token;
    } catch (e) {
      console.error('CSRF: Failed to store token:', e);
      return null;
    }
  }

  /**
   * Get current CSRF token
   * @returns {object} {token, valid, error}
   */
  function getToken() {
    const token = sessionStorage.getItem(CONFIG.STORAGE_KEY);
    const expiry = sessionStorage.getItem(CONFIG.EXPIRY_KEY);
    const userId = sessionStorage.getItem('csrf_user_id');

    if (!token || !expiry) {
      return { token: null, valid: false, error: 'No CSRF token found' };
    }

    const now = Date.now();
    if (now > parseInt(expiry)) {
      clearToken();
      return { token: null, valid: false, error: 'CSRF token expired' };
    }

    return { token, valid: true, userId, expiresIn: parseInt(expiry) - now };
  }

  /**
   * Validate CSRF token on operation
   * Checks: token presence, expiration, format, user binding
   * @param {string} operation - Operation name (login, submitAnswer, etc)
   * @param {string} providedToken - Token from request
   * @param {string} userId - Current user ID
   * @returns {object} {valid, error, token}
   */
  function validateToken(operation, providedToken, userId) {
    // Operation must be in allowed list
    if (!CONFIG.OPERATIONS.includes(operation)) {
      return { valid: false, error: `Invalid operation: ${operation}` };
    }

    // No token provided
    if (!providedToken) {
      return { valid: false, error: `CSRF token required for ${operation}` };
    }

    // Token must be string
    if (typeof providedToken !== 'string') {
      return { valid: false, error: 'CSRF token must be string' };
    }

    // Token format must be 64 hex characters
    if (!/^[a-f0-9]{64}$/.test(providedToken)) {
      return { valid: false, error: 'Invalid CSRF token format' };
    }

    const stored = getToken();

    // No stored token
    if (!stored.valid) {
      return { valid: false, error: stored.error };
    }

    // Token mismatch
    if (providedToken !== stored.token) {
      console.warn(`CSRF: Token mismatch for ${operation}`);
      return { valid: false, error: 'CSRF token mismatch' };
    }

    // User ID mismatch (token bound to user)
    if (userId && stored.userId !== userId) {
      return { valid: false, error: 'CSRF token bound to different user' };
    }

    return { valid: true, token: stored.token, userId: stored.userId };
  }

  /**
   * Refresh token if approaching expiration
   * Called automatically on user activity
   * @returns {object} {refreshed, token}
   */
  function refreshTokenIfNeeded() {
    const stored = getToken();
    if (!stored.valid) {
      return { refreshed: false, error: stored.error };
    }

    const expiryTime = parseInt(sessionStorage.getItem(CONFIG.EXPIRY_KEY));
    const now = Date.now();
    const timeRemaining = expiryTime - now;

    // Refresh if less than 30 minutes remaining
    if (timeRemaining < CONFIG.TOKEN_REFRESH_MS) {
      const userId = sessionStorage.getItem('csrf_user_id');
      const newToken = createToken(userId);
      return { refreshed: true, token: newToken };
    }

    return { refreshed: false, token: stored.token };
  }

  /**
   * Clear CSRF token on logout
   */
  function clearToken() {
    try {
      sessionStorage.removeItem(CONFIG.STORAGE_KEY);
      sessionStorage.removeItem(CONFIG.EXPIRY_KEY);
      sessionStorage.removeItem(CONFIG.SESSION_KEY);
      sessionStorage.removeItem('csrf_user_id');
      console.log('CSRF: Token cleared');
    } catch (e) {
      console.error('CSRF: Failed to clear token:', e);
    }
  }

  /**
   * Get token for inclusion in forms/requests
   * Automatically refreshes if needed
   * @returns {string} CSRF token
   */
  function getTokenForRequest() {
    refreshTokenIfNeeded();
    const stored = getToken();
    return stored.token || '';
  }

  /**
   * Create hidden input field for form submission
   * @returns {HTMLElement} Hidden input with CSRF token
   */
  function createTokenInput() {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'csrf_token';
    input.value = getTokenForRequest();
    return input;
  }

  /**
   * Add CSRF token to request headers
   * @param {Headers} headers - Fetch API headers object
   * @returns {Headers} Updated headers with token
   */
  function addTokenToHeaders(headers = {}) {
    const token = getTokenForRequest();
    return {
      ...headers,
      'X-CSRF-Token': token,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Set up automatic token refresh on user activity
   */
  function setupAutoRefresh() {
    const activityEvents = ['click', 'keypress', 'mousemove', 'scroll'];
    let refreshTimeout = null;

    activityEvents.forEach(event => {
      document.addEventListener(event, () => {
        clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(() => {
          refreshTokenIfNeeded();
        }, 5000); // Batch checks every 5 seconds
      }, true);
    });
  }

  /**
   * Clear tokens on page unload
   */
  function setupCleanup() {
    window.addEventListener('beforeunload', () => {
      // Note: Don't clear on beforeunload - user might navigate back
      // sessionStorage is automatically cleared when tab closes
    });

    // Clear on logout via storage event (multi-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key === 'currentUser' && e.newValue === null) {
        clearToken();
      }
    });
  }

  /**
   * Get CSRF status for debugging
   * @returns {object} Current token status
   */
  function getStatus() {
    const stored = getToken();
    const expiryTime = sessionStorage.getItem(CONFIG.EXPIRY_KEY);
    const timeRemaining = expiryTime ? parseInt(expiryTime) - Date.now() : 0;

    return {
      hasToken: stored.valid,
      userId: stored.userId || null,
      expiresIn: Math.max(0, timeRemaining),
      expiresInMinutes: Math.max(0, Math.floor(timeRemaining / 1000 / 60)),
      isExpired: !stored.valid,
      error: stored.error || null
    };
  }

  /**
   * Initialize CSRF protection
   * Sets up token refresh and cleanup handlers
   */
  function init() {
    setupAutoRefresh();
    setupCleanup();
    console.log('CSRF protection initialized');
  }

  // Export to global context
  window.csrfProtection = {
    createToken,
    getToken,
    validateToken,
    refreshTokenIfNeeded,
    clearToken,
    getTokenForRequest,
    createTokenInput,
    addTokenToHeaders,
    getStatus,
    init,
    CONFIG
  };

  // Auto-initialize when securityContext is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
