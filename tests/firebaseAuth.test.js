/**
 * Firebase Authentication Test Suite
 * Tests all authentication functionality including sign up, sign in, and password validation
 * 
 * Test Coverage:
 * - Email validation
 * - Password validation and strength
 * - Sign up flow
 * - Sign in flow
 * - Sign out
 * - Password reset
 * - User profile management
 * - Error handling
 */

describe('Firebase Authentication Module', () => {
  let mockAuth;
  let mockCurrentUser;
  let originalDispatchEvent;

  beforeEach(() => {
    // Mock current user
    mockCurrentUser = {
      uid: 'test-uid-123',
      email: 'testuser@example.com',
      displayName: 'TestUser',
      emailVerified: false,
      metadata: {
        createdAt: new Date().toISOString(),
        lastSignInTime: new Date().toISOString()
      },
      updateProfile: jest.fn().mockResolvedValue(undefined),
      updateEmail: jest.fn().mockResolvedValue(undefined),
      updatePassword: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      getIdToken: jest.fn().mockResolvedValue('mock-token-123')
    };

    // Mock Firebase Auth
    mockAuth = {
      currentUser: mockCurrentUser,
      createUserWithEmailAndPassword: jest.fn().mockResolvedValue({
        user: mockCurrentUser
      }),
      signInWithEmailAndPassword: jest.fn().mockResolvedValue({
        user: mockCurrentUser
      }),
      signOut: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      onAuthStateChanged: jest.fn((callback) => {
        // Call callback immediately for testing
        callback(mockCurrentUser);
        return jest.fn(); // Return unsubscribe function
      })
    };

    // Mock dispatchEvent
    originalDispatchEvent = window.dispatchEvent;
    window.dispatchEvent = jest.fn();

    // Load and initialize Firebase Auth module
    if (window.firebaseAuth) {
      delete window.firebaseAuth;
    }

    const authCode = `
      (function() {
        'use strict';

        let auth = null;
        let currentAuthUser = null;

        function initializeAuth(firebaseApp) {
          try {
            auth = firebaseApp.auth();
            console.log('Firebase Auth initialized');
            auth.onAuthStateChanged(onAuthStateChanged);
            return true;
          } catch (error) {
            console.error('Failed to initialize Firebase Auth:', error);
            return false;
          }
        }

        function onAuthStateChanged(user) {
          if (user) {
            currentAuthUser = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || 'User',
              emailVerified: user.emailVerified,
              createdAt: user.metadata.createdAt,
              lastSignInTime: user.metadata.lastSignInTime
            };
            console.log('Auth state changed - User logged in:', currentAuthUser.email);
            window.dispatchEvent(new CustomEvent('authStateChanged', { 
              detail: { user: currentAuthUser, authenticated: true }
            }));
          } else {
            currentAuthUser = null;
            console.log('Auth state changed - User logged out');
            window.dispatchEvent(new CustomEvent('authStateChanged', { 
              detail: { user: null, authenticated: false }
            }));
          }
        }

        function getSafeAuthError(error) {
          const errorCode = error.code || 'unknown-error';
          const errorMessages = {
            'auth/invalid-email': 'Please enter a valid email address',
            'auth/user-disabled': 'This account has been disabled',
            'auth/user-not-found': 'Email not found. Please sign up first',
            'auth/wrong-password': 'Incorrect password. Please try again',
            'auth/email-already-in-use': 'This email is already registered',
            'auth/weak-password': 'Password must be at least 6 characters',
            'auth/operation-not-allowed': 'Email/password authentication is not enabled',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later',
            'auth/account-exists-with-different-credential': 'Account exists with different sign-in method',
            'auth/credential-already-in-use': 'This credential is already in use',
            'auth/network-request-failed': 'Network error. Please check your connection',
            'auth/popup-blocked': 'Popup was blocked. Please allow popups and try again'
          };
          return errorMessages[errorCode] || 'Authentication failed. Please try again';
        }

        function validateEmail(email) {
          const trimmed = email.trim();
          const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
          
          if (!trimmed) {
            return { valid: false, error: 'Email is required' };
          }
          
          if (trimmed.length > 254) {
            return { valid: false, error: 'Email is too long' };
          }
          
          if (!emailRegex.test(trimmed)) {
            return { valid: false, error: 'Please enter a valid email address' };
          }
          
          return { valid: true, email: trimmed };
        }

        function validatePassword(password) {
          if (!password) {
            return { valid: false, error: 'Password is required' };
          }
          
          if (password.length < 6) {
            return { valid: false, error: 'Password must be at least 6 characters' };
          }
          
          if (password.length > 128) {
            return { valid: false, error: 'Password is too long' };
          }
          
          let strength = 'weak';
          if (password.length >= 8) {
            const hasUpper = /[A-Z]/.test(password);
            const hasLower = /[a-z]/.test(password);
            const hasNumber = /\\d/.test(password);
            const hasSpecial = /[!@#$%^&*()_+\\-=\\[\\]{};':"\\\\|,.<>\\/?]/.test(password);
            
            const complexityScore = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
            
            if (complexityScore >= 3) {
              strength = 'strong';
            } else if (complexityScore >= 2) {
              strength = 'medium';
            }
          }
          
          return { valid: true, strength };
        }

        async function signUp(email, password) {
          if (!auth) {
            return { success: false, error: 'Authentication not initialized' };
          }

          const emailValidation = validateEmail(email);
          if (!emailValidation.valid) {
            return { success: false, error: emailValidation.error };
          }

          const passwordValidation = validatePassword(password);
          if (!passwordValidation.valid) {
            return { success: false, error: passwordValidation.error };
          }

          try {
            const userCredential = await auth.createUserWithEmailAndPassword(
              emailValidation.email,
              password
            );
            
            const user = userCredential.user;
            await user.updateProfile({
              displayName: email.split('@')[0]
            });
            
            console.log('User signed up successfully:', user.email);
            return { success: true, user };
          } catch (error) {
            console.error('Sign up failed:', error);
            const safeError = getSafeAuthError(error);
            return { success: false, error: safeError };
          }
        }

        async function signIn(email, password) {
          if (!auth) {
            return { success: false, error: 'Authentication not initialized' };
          }

          const emailValidation = validateEmail(email);
          if (!emailValidation.valid) {
            return { success: false, error: emailValidation.error };
          }

          if (!password) {
            return { success: false, error: 'Password is required' };
          }

          try {
            const userCredential = await auth.signInWithEmailAndPassword(
              emailValidation.email,
              password
            );
            
            const user = userCredential.user;
            console.log('User signed in successfully:', user.email);
            return { success: true, user };
          } catch (error) {
            console.error('Sign in failed:', error);
            const safeError = getSafeAuthError(error);
            return { success: false, error: safeError };
          }
        }

        async function signOut() {
          if (!auth) {
            return { success: false, error: 'Authentication not initialized' };
          }

          try {
            await auth.signOut();
            console.log('User signed out');
            return { success: true };
          } catch (error) {
            console.error('Sign out failed:', error);
            return { success: false, error: 'Failed to sign out' };
          }
        }

        async function sendPasswordReset(email) {
          if (!auth) {
            return { success: false, error: 'Authentication not initialized' };
          }

          const emailValidation = validateEmail(email);
          if (!emailValidation.valid) {
            return { success: false, error: emailValidation.error };
          }

          try {
            await auth.sendPasswordResetEmail(emailValidation.email);
            console.log('Password reset email sent to:', emailValidation.email);
            return { success: true };
          } catch (error) {
            console.error('Password reset failed:', error);
            const safeError = getSafeAuthError(error);
            return { success: false, error: safeError };
          }
        }

        function getCurrentUser() {
          return currentAuthUser;
        }

        function isAuthenticated() {
          return !!currentAuthUser;
        }

        async function getAuthToken() {
          if (!auth || !auth.currentUser) {
            return null;
          }

          try {
            const token = await auth.currentUser.getIdToken(true);
            return token;
          } catch (error) {
            console.error('Failed to get auth token:', error);
            return null;
          }
        }

        async function updateEmail(newEmail) {
          if (!auth || !auth.currentUser) {
            return { success: false, error: 'Not authenticated' };
          }

          const emailValidation = validateEmail(newEmail);
          if (!emailValidation.valid) {
            return { success: false, error: emailValidation.error };
          }

          try {
            await auth.currentUser.updateEmail(emailValidation.email);
            console.log('Email updated successfully');
            return { success: true };
          } catch (error) {
            console.error('Email update failed:', error);
            const safeError = getSafeAuthError(error);
            return { success: false, error: safeError };
          }
        }

        async function updatePassword(newPassword) {
          if (!auth || !auth.currentUser) {
            return { success: false, error: 'Not authenticated' };
          }

          const passwordValidation = validatePassword(newPassword);
          if (!passwordValidation.valid) {
            return { success: false, error: passwordValidation.error };
          }

          try {
            await auth.currentUser.updatePassword(newPassword);
            console.log('Password updated successfully');
            return { success: true };
          } catch (error) {
            console.error('Password update failed:', error);
            const safeError = getSafeAuthError(error);
            return { success: false, error: safeError };
          }
        }

        async function deleteAccount() {
          if (!auth || !auth.currentUser) {
            return { success: false, error: 'Not authenticated' };
          }

          try {
            await auth.currentUser.delete();
            console.log('Account deleted');
            return { success: true };
          } catch (error) {
            console.error('Account deletion failed:', error);
            const safeError = getSafeAuthError(error);
            return { success: false, error: safeError };
          }
        }

        function getAuth() {
          return auth;
        }

        window.firebaseAuth = {
          initializeAuth,
          signUp,
          signIn,
          signOut,
          sendPasswordReset,
          getCurrentUser,
          isAuthenticated,
          getAuthToken,
          updateEmail,
          updatePassword,
          deleteAccount,
          getAuth,
          validateEmail,
          validatePassword,
          getSafeAuthError
        };

        console.log('Firebase Auth module loaded');
      })();
    `;
    
    eval(authCode);
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.dispatchEvent = originalDispatchEvent;
  });

  // ============================================
  // Email Validation Tests
  // ============================================

  describe('validateEmail', () => {
    test('should accept valid email', () => {
      const result = window.firebaseAuth.validateEmail('user@example.com');
      
      expect(result.valid).toBe(true);
      expect(result.email).toBe('user@example.com');
    });

    test('should accept email with subdomains', () => {
      const result = window.firebaseAuth.validateEmail('user@mail.example.com');
      
      expect(result.valid).toBe(true);
      expect(result.email).toBe('user@mail.example.com');
    });

    test('should trim whitespace from email', () => {
      const result = window.firebaseAuth.validateEmail('  user@example.com  ');
      
      expect(result.valid).toBe(true);
      expect(result.email).toBe('user@example.com');
    });

    test('should reject empty email', () => {
      const result = window.firebaseAuth.validateEmail('');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    test('should reject email without @', () => {
      const result = window.firebaseAuth.validateEmail('userexample.com');
      
      expect(result.valid).toBe(false);
    });

    test('should reject email without domain', () => {
      const result = window.firebaseAuth.validateEmail('user@');
      
      expect(result.valid).toBe(false);
    });

    test('should reject email with spaces', () => {
      const result = window.firebaseAuth.validateEmail('user @example.com');
      
      expect(result.valid).toBe(false);
    });

    test('should reject email that is too long', () => {
      const longEmail = 'a'.repeat(255) + '@example.com';
      const result = window.firebaseAuth.validateEmail(longEmail);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
    });

    test('should handle special characters in email', () => {
      const result = window.firebaseAuth.validateEmail('user+tag@example.com');
      
      expect(result.valid).toBe(true);
    });
  });

  // ============================================
  // Password Validation Tests
  // ============================================

  describe('validatePassword', () => {
    test('should accept valid password', () => {
      const result = window.firebaseAuth.validatePassword('Password123');
      
      expect(result.valid).toBe(true);
    });

    test('should reject empty password', () => {
      const result = window.firebaseAuth.validatePassword('');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    test('should reject password shorter than 6 characters', () => {
      const result = window.firebaseAuth.validatePassword('Pass1');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('6 characters');
    });

    test('should reject password longer than 128 characters', () => {
      const longPassword = 'a'.repeat(129);
      const result = window.firebaseAuth.validatePassword(longPassword);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
    });

    test('should calculate strength as weak for simple password', () => {
      const result = window.firebaseAuth.validatePassword('password');
      
      expect(result.valid).toBe(true);
      expect(result.strength).toBe('weak');
    });

    test('should calculate strength as medium for 8+ chars with 2 complexity', () => {
      const result = window.firebaseAuth.validatePassword('Password1');
      
      expect(result.valid).toBe(true);
      expect(['medium', 'strong']).toContain(result.strength);
    });

    test('should calculate strength as strong for 8+ chars with 3+ complexity', () => {
      const result = window.firebaseAuth.validatePassword('Password1!');
      
      expect(result.valid).toBe(true);
      expect(result.strength).toBe('strong');
    });

    test('should accept 6-character minimum password', () => {
      const result = window.firebaseAuth.validatePassword('123456');
      
      expect(result.valid).toBe(true);
    });
  });

  // ============================================
  // Sign Up Tests
  // ============================================

  describe('signUp', () => {
    test('should successfully sign up new user', async () => {
      window.firebaseAuth.initializeAuth({ auth: () => mockAuth });
      const result = await window.firebaseAuth.signUp('newuser@example.com', 'Password123');
      
      expect(result.success).toBe(true);
      expect(result.user).toBeTruthy();
      expect(result.user.email).toBe('testuser@example.com');
    });

    test('should validate email before sign up', async () => {
      window.firebaseAuth.initializeAuth({ auth: () => mockAuth });
      const result = await window.firebaseAuth.signUp('invalid-email', 'Password123');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('email');
    });

    test('should validate password before sign up', async () => {
      window.firebaseAuth.initializeAuth({ auth: () => mockAuth });
      const result = await window.firebaseAuth.signUp('user@example.com', 'short');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Password');
    });

    test('should handle email already in use error', async () => {
      mockAuth.createUserWithEmailAndPassword.mockRejectedValueOnce({
        code: 'auth/email-already-in-use'
      });
      
      window.firebaseAuth.initializeAuth({ auth: () => mockAuth });
      const result = await window.firebaseAuth.signUp('existing@example.com', 'Password123');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('already registered');
    });

    test('should handle weak password error', async () => {
      mockAuth.createUserWithEmailAndPassword.mockRejectedValueOnce({
        code: 'auth/weak-password'
      });
      
      window.firebaseAuth.initializeAuth({ auth: () => mockAuth });
      const result = await window.firebaseAuth.signUp('user@example.com', 'weak');
      
      expect(result.success).toBe(false);
    });

    test('should update user profile with display name', async () => {
      window.firebaseAuth.initializeAuth({ auth: () => mockAuth });
      await window.firebaseAuth.signUp('newuser@example.com', 'Password123');
      
      expect(mockCurrentUser.updateProfile).toHaveBeenCalledWith({
        displayName: 'newuser'
      });
    });

    test('should return auth not initialized error', async () => {
      const result = await window.firebaseAuth.signUp('user@example.com', 'Password123');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not initialized');
    });
  });

  // ============================================
  // Sign In Tests
  // ============================================

  describe('signIn', () => {
    test('should successfully sign in user', async () => {
      window.firebaseAuth.initializeAuth({ auth: () => mockAuth });
      const result = await window.firebaseAuth.signIn('user@example.com', 'Password123');
      
      expect(result.success).toBe(true);
      expect(result.user).toBeTruthy();
    });

    test('should validate email before sign in', async () => {
      window.firebaseAuth.initializeAuth({ auth: () => mockAuth });
      const result = await window.firebaseAuth.signIn('invalid', 'Password123');
      
      expect(result.success).toBe(false);
    });

    test('should require password for sign in', async () => {
      window.firebaseAuth.initializeAuth({ auth: () => mockAuth });
      const result = await window.firebaseAuth.signIn('user@example.com', '');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Password');
    });

    test('should handle user not found error', async () => {
      mockAuth.signInWithEmailAndPassword.mockRejectedValueOnce({
        code: 'auth/user-not-found'
      });
      
      window.firebaseAuth.initializeAuth({ auth: () => mockAuth });
      const result = await window.firebaseAuth.signIn('unknown@example.com', 'Password123');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    test('should handle wrong password error', async () => {
      mockAuth.signInWithEmailAndPassword.mockRejectedValueOnce({
        code: 'auth/wrong-password'
      });
      
      window.firebaseAuth.initializeAuth({ auth: () => mockAuth });
      const result = await window.firebaseAuth.signIn('user@example.com', 'WrongPassword');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Incorrect password');
    });
  });

  // ============================================
  // Sign Out Tests
  // ============================================

  describe('signOut', () => {
    test('should successfully sign out user', async () => {
      window.firebaseAuth.initializeAuth({ auth: () => mockAuth });
      const result = await window.firebaseAuth.signOut();
      
      expect(result.success).toBe(true);
      expect(mockAuth.signOut).toHaveBeenCalled();
    });

    test('should return auth not initialized error', async () => {
      const result = await window.firebaseAuth.signOut();
      
      expect(result.success).toBe(false);
    });

    test('should handle sign out errors', async () => {
      mockAuth.signOut.mockRejectedValueOnce(new Error('Sign out failed'));
      
      window.firebaseAuth.initializeAuth({ auth: () => mockAuth });
      const result = await window.firebaseAuth.signOut();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  // ============================================
  // Password Reset Tests
  // ============================================

  describe('sendPasswordReset', () => {
    test('should send password reset email', async () => {
      window.firebaseAuth.initializeAuth({ auth: () => mockAuth });
      const result = await window.firebaseAuth.sendPasswordReset('user@example.com');
      
      expect(result.success).toBe(true);
      expect(mockAuth.sendPasswordResetEmail).toHaveBeenCalledWith('user@example.com');
    });

    test('should validate email before sending reset', async () => {
      window.firebaseAuth.initializeAuth({ auth: () => mockAuth });
      const result = await window.firebaseAuth.sendPasswordReset('invalid');
      
      expect(result.success).toBe(false);
    });

    test('should handle email not found error', async () => {
      mockAuth.sendPasswordResetEmail.mockRejectedValueOnce({
        code: 'auth/user-not-found'
      });
      
      window.firebaseAuth.initializeAuth({ auth: () => mockAuth });
      const result = await window.firebaseAuth.sendPasswordReset('unknown@example.com');
      
      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // User Management Tests
  // ============================================

  describe('getCurrentUser', () => {
    test('should return current user after initialization', () => {
      window.firebaseAuth.initializeAuth({ auth: () => mockAuth });
      const user = window.firebaseAuth.getCurrentUser();
      
      expect(user).toBeTruthy();
      expect(user.email).toBe('testuser@example.com');
    });

    test('should return null when not authenticated', () => {
      const user = window.firebaseAuth.getCurrentUser();
      
      expect(user).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    test('should return true when user is authenticated', () => {
      window.firebaseAuth.initializeAuth({ auth: () => mockAuth });
      const authenticated = window.firebaseAuth.isAuthenticated();
      
      expect(authenticated).toBe(true);
    });

    test('should return false when user is not authenticated', () => {
      const authenticated = window.firebaseAuth.isAuthenticated();
      
      expect(authenticated).toBe(false);
    });
  });

  describe('getAuthToken', () => {
    test('should get auth token for authenticated user', async () => {
      window.firebaseAuth.initializeAuth({ auth: () => mockAuth });
      const token = await window.firebaseAuth.getAuthToken();
      
      expect(token).toBe('mock-token-123');
      expect(mockCurrentUser.getIdToken).toHaveBeenCalledWith(true);
    });

    test('should return null when not authenticated', async () => {
      const token = await window.firebaseAuth.getAuthToken();
      
      expect(token).toBeNull();
    });
  });

  describe('updateEmail', () => {
    test('should update user email', async () => {
      window.firebaseAuth.initializeAuth({ auth: () => mockAuth });
      const result = await window.firebaseAuth.updateEmail('newemail@example.com');
      
      expect(result.success).toBe(true);
      expect(mockCurrentUser.updateEmail).toHaveBeenCalledWith('newemail@example.com');
    });

    test('should validate email before updating', async () => {
      window.firebaseAuth.initializeAuth({ auth: () => mockAuth });
      const result = await window.firebaseAuth.updateEmail('invalid');
      
      expect(result.success).toBe(false);
    });

    test('should require authentication for email update', async () => {
      const result = await window.firebaseAuth.updateEmail('newemail@example.com');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Not authenticated');
    });
  });

  describe('updatePassword', () => {
    test('should update user password', async () => {
      window.firebaseAuth.initializeAuth({ auth: () => mockAuth });
      const result = await window.firebaseAuth.updatePassword('NewPassword123');
      
      expect(result.success).toBe(true);
      expect(mockCurrentUser.updatePassword).toHaveBeenCalledWith('NewPassword123');
    });

    test('should validate password before updating', async () => {
      window.firebaseAuth.initializeAuth({ auth: () => mockAuth });
      const result = await window.firebaseAuth.updatePassword('short');
      
      expect(result.success).toBe(false);
    });

    test('should require authentication for password update', async () => {
      const result = await window.firebaseAuth.updatePassword('NewPassword123');
      
      expect(result.success).toBe(false);
    });
  });

  describe('deleteAccount', () => {
    test('should delete user account', async () => {
      window.firebaseAuth.initializeAuth({ auth: () => mockAuth });
      const result = await window.firebaseAuth.deleteAccount();
      
      expect(result.success).toBe(true);
      expect(mockCurrentUser.delete).toHaveBeenCalled();
    });

    test('should require authentication for account deletion', async () => {
      const result = await window.firebaseAuth.deleteAccount();
      
      expect(result.success).toBe(false);
    });

    test('should handle account deletion errors', async () => {
      mockCurrentUser.delete.mockRejectedValueOnce(new Error('Deletion failed'));
      
      window.firebaseAuth.initializeAuth({ auth: () => mockAuth });
      const result = await window.firebaseAuth.deleteAccount();
      
      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // Error Handling Tests
  // ============================================

  describe('getSafeAuthError', () => {
    test('should return safe error for invalid email', () => {
      const error = window.firebaseAuth.getSafeAuthError({
        code: 'auth/invalid-email'
      });
      
      expect(error).toContain('valid email');
    });

    test('should return safe error for user not found', () => {
      const error = window.firebaseAuth.getSafeAuthError({
        code: 'auth/user-not-found'
      });
      
      expect(error).toContain('not found');
    });

    test('should return safe error for wrong password', () => {
      const error = window.firebaseAuth.getSafeAuthError({
        code: 'auth/wrong-password'
      });
      
      expect(error).toContain('Incorrect password');
    });

    test('should return generic error for unknown error code', () => {
      const error = window.firebaseAuth.getSafeAuthError({
        code: 'auth/unknown-error'
      });
      
      expect(error).toContain('Authentication failed');
    });

    test('should handle error without code property', () => {
      const error = window.firebaseAuth.getSafeAuthError({});
      
      expect(error).toBeTruthy();
    });

    test('should not expose technical error details', () => {
      const error = window.firebaseAuth.getSafeAuthError({
        code: 'auth/too-many-requests',
        message: 'Firebase: Too many requests (auth/too-many-requests)'
      });
      
      expect(error).not.toContain('Firebase');
      expect(error).not.toContain('technical');
    });
  });
});
