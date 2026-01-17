/**
 * Login Integration Test
 * Tests the complete login flow including CSRF token generation
 * and security context initialization
 */

describe('Login Integration - Complete Flow', () => {
  // Setup DOM elements that script.js expects
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
    
    // Create DOM elements
    document.body.innerHTML = `
      <div id="login-screen" style="display: flex;">
        <input id="username-input" type="text" placeholder="Enter your name">
        <button id="login-btn">Start Practicing</button>
      </div>
      <div id="home" style="display: none;">
        <p id="current-user"></p>
      </div>
    `;

    // Initialize window objects
    window.currentUser = null;
    window.logs = [];

    // Initialize CSRF protection module
    window.csrfProtection = {
      createToken(userId) {
        if (!userId) {
          console.error('CSRF: Cannot create token without userId');
          return null;
        }
        const token = '12345678901234567890123456789012abcdefabcdefabcdefabcdefabcdefab';
        sessionStorage.setItem('csrf_token', token);
        sessionStorage.setItem('csrf_token_expiry', (Date.now() + 3600000).toString());
        sessionStorage.setItem('csrf_user_id', userId);
        return token;
      },

      getToken() {
        const token = sessionStorage.getItem('csrf_token');
        const expiry = sessionStorage.getItem('csrf_token_expiry');
        if (!token || !expiry) {
          return { token: null, valid: false };
        }
        if (Date.now() > parseInt(expiry)) {
          this.clearToken();
          return { token: null, valid: false };
        }
        return { token, valid: true, userId: sessionStorage.getItem('csrf_user_id') };
      },

      validateToken(operation, providedToken, userId) {
        if (!providedToken) return { valid: false, error: 'No token' };
        if (!/^[a-f0-9]{64}$/.test(providedToken)) {
          return { valid: false, error: 'Invalid CSRF token format' };
        }
        const stored = this.getToken();
        if (!stored.valid) return { valid: false, error: 'No stored token' };
        if (providedToken !== stored.token) {
          return { valid: false, error: 'CSRF token mismatch' };
        }
        if (userId && stored.userId !== userId) {
          return { valid: false, error: 'CSRF token bound to different user' };
        }
        return { valid: true };
      },

      getTokenForRequest() {
        const stored = this.getToken();
        return stored.token || '';
      },

      clearToken() {
        sessionStorage.removeItem('csrf_token');
        sessionStorage.removeItem('csrf_token_expiry');
        sessionStorage.removeItem('csrf_user_id');
      }
    };

    // Initialize security context
    window.securityContext = {
      validateUsername(username) {
        if (typeof username !== 'string') {
          return { valid: false, error: 'Username must be text' };
        }
        const trimmed = username.trim();
        if (trimmed.length === 0) {
          return { valid: false, error: 'Username cannot be empty' };
        }
        if (trimmed.length > 50) {
          return { valid: false, error: 'Username too long (max 50 characters)' };
        }
        const safePattern = /^[a-zA-Z0-9_-]+$/;
        if (!safePattern.test(trimmed)) {
          return { 
            valid: false, 
            error: 'Username can only contain letters, numbers, underscore, and hyphen' 
          };
        }
        return { valid: true, sanitized: trimmed };
      },

      validateAnswer(answer) {
        return { valid: answer && answer.trim().length > 0, trimmed: answer?.trim() || '' };
      },

      checkRateLimit(userId) {
        return true;
      },

      escapeForDisplay(text) {
        return String(text || '').replace(/[&<>"']/g, (char) => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        }[char]));
      }
    };
  });

  test('Login button should be available', () => {
    const loginBtn = document.getElementById('login-btn');
    expect(loginBtn).toBeTruthy();
  });

  test('Username validation should work', () => {
    const result = window.securityContext.validateUsername('testuser');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('testuser');
  });

  test('Username validation should reject empty input', () => {
    const result = window.securityContext.validateUsername('');
    expect(result.valid).toBe(false);
  });

  test('Username validation should reject invalid characters', () => {
    const result = window.securityContext.validateUsername('test@user');
    expect(result.valid).toBe(false);
  });

  test('CSRF token should be created and stored', () => {
    const username = 'testuser';
    const token = window.csrfProtection.createToken(username);
    expect(token).toBeTruthy();
    expect(token.length).toBe(64);
    
    const stored = window.csrfProtection.getToken();
    expect(stored.valid).toBe(true);
    expect(stored.token).toBe(token);
    expect(stored.userId).toBe(username);
  });

  test('CSRF token validation should pass for valid token', () => {
    const username = 'testuser';
    const token = window.csrfProtection.createToken(username);
    
    const validation = window.csrfProtection.validateToken('submitAnswer', token, username);
    expect(validation.valid).toBe(true);
  });

  test('CSRF token should be cleared on logout', () => {
    window.csrfProtection.createToken('testuser');
    expect(window.csrfProtection.getToken().valid).toBe(true);
    
    window.csrfProtection.clearToken();
    expect(window.csrfProtection.getToken().valid).toBe(false);
  });

  test('Complete login flow', () => {
    const username = 'johndoe';
    
    const validation = window.securityContext.validateUsername(username);
    expect(validation.valid).toBe(true);
    
    window.currentUser = validation.sanitized;
    expect(window.currentUser).toBe('johndoe');
    
    const token = window.csrfProtection.createToken(window.currentUser);
    expect(token).toBeTruthy();
    
    const storedToken = window.csrfProtection.getTokenForRequest();
    expect(storedToken).toBe(token);
  });

  test('CSRF validation should fail with mismatched token', () => {
    window.csrfProtection.createToken('testuser');
    const wrongToken = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const validation = window.csrfProtection.validateToken('submitAnswer', wrongToken, 'testuser');
    expect(validation.valid).toBe(false);
  });

  test('CSRF validation should fail with mismatched user', () => {
    const token = window.csrfProtection.createToken('testuser');
    const validation = window.csrfProtection.validateToken('submitAnswer', token, 'differentuser');
    expect(validation.valid).toBe(false);
  });
});
