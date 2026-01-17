/**
 * Firebase Authentication Module
 * Integrates Firebase Auth for secure user authentication
 * 
 * Features:
 * - Email/password authentication
 * - User session persistence
 * - Secure logout
 * - Auth state management
 * - Error handling with user-friendly messages
 */

(function() {
  'use strict';

  // Firebase Auth instance (initialized after Firebase SDK loads)
  let auth = null;
  let currentAuthUser = null;

  /**
   * Initialize Firebase Authentication
   * Call this after Firebase SDK is loaded
   * @param {object} firebaseApp - Firebase app instance
   */
  function initializeAuth(firebaseApp) {
    try {
      auth = firebaseApp.auth();
      console.log('Firebase Auth initialized');
      
      // Listen for auth state changes
      auth.onAuthStateChanged(onAuthStateChanged);
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Firebase Auth:', error);
      return false;
    }
  }

  /**
   * Handle auth state changes
   * Called whenever user logs in/out
   */
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
      
      // Notify other modules of successful auth
      window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { user: currentAuthUser, authenticated: true }
      }));
    } else {
      currentAuthUser = null;
      console.log('Auth state changed - User logged out');
      
      // Notify other modules of logout
      window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { user: null, authenticated: false }
      }));
    }
  }

  /**
   * Sanitize error messages from Firebase Auth
   * Returns user-friendly error message
   */
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

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {object} {valid, error}
   */
  function validateEmail(email) {
    const trimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
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

  /**
   * Validate password strength
   * Minimum 6 characters, combination of letter and number recommended
   * @param {string} password - Password to validate
   * @returns {object} {valid, error, strength}
   */
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
      const hasNumber = /\d/.test(password);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
      
      const complexityScore = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
      
      if (complexityScore >= 3) {
        strength = 'strong';
      } else if (complexityScore >= 2) {
        strength = 'medium';
      }
    }
    
    return { valid: true, strength };
  }

  /**
   * Sign up new user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} {success, user, error}
   */
  async function signUp(email, password) {
    if (!auth) {
      return { success: false, error: 'Authentication not initialized' };
    }

    // Validate inputs
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
      
      // Set display name from email
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

  /**
   * Sign in existing user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} {success, user, error}
   */
  async function signIn(email, password) {
    if (!auth) {
      return { success: false, error: 'Authentication not initialized' };
    }

    // Validate inputs
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

  /**
   * Sign out current user
   * @returns {Promise} {success, error}
   */
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

  /**
   * Send password reset email
   * @param {string} email - User email
   * @returns {Promise} {success, error}
   */
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

  /**
   * Get current authenticated user
   * @returns {object} Current auth user or null
   */
  function getCurrentUser() {
    return currentAuthUser;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  function isAuthenticated() {
    return !!currentAuthUser;
  }

  /**
   * Get authentication token for API requests
   * @returns {Promise} Auth token string
   */
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

  /**
   * Update user email
   * @param {string} newEmail - New email address
   * @returns {Promise} {success, error}
   */
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

  /**
   * Update user password
   * @param {string} newPassword - New password
   * @returns {Promise} {success, error}
   */
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

  /**
   * Delete user account
   * Warning: This is irreversible
   * @returns {Promise} {success, error}
   */
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

  /**
   * Get Firebase Auth service
   * For advanced use cases
   */
  function getAuth() {
    return auth;
  }

  // Export to global context
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
