/**
 * Security Integration Module
 * Patches script.js functions with input validation and sanitization
 * Must be loaded AFTER securityUtils.js and BEFORE script.js
 */

// Create a global security context
window.securityContext = {
  // Rate limiters per user
  rateLimiterSubmit: null,
  
  // Offline queue for pending logs
  offlineQueue: null,
  
  // Initialize security context
  init() {
    // Make validation functions available on securityContext for easy access
    this.validateUsername = window.validateUsername || ((u) => ({ valid: !!u, sanitized: u }));
    this.validateAnswer = (answer) => {
      if (!window.validateAnswerLength) {
        return { valid: answer && answer.trim().length > 0, trimmed: answer?.trim() || '' };
      }
      return window.validateAnswerLength(answer, 100);
    };
    this.sanitizeError = (error) => {
      if (!window.sanitizeErrorMessage) {
        return 'An error occurred. Please try again.';
      }
      return window.sanitizeErrorMessage(error?.message || error?.toString() || 'Unknown error');
    };
    this.escapeForDisplay = (text) => {
      if (!window.escapeHTML) {
        return String(text || '').replace(/[&<>"']/g, (char) => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        }[char]));
      }
      return window.escapeHTML(text);
    };
    
    // Create rate limiter with 1.5 second cooldown
    this.rateLimiterSubmit = window.createRateLimiter ? window.createRateLimiter(1500) : null;
    
    // Create offline queue with 200 pending logs max
    this.offlineQueue = window.createOfflineQueue ? window.createOfflineQueue(200) : null;
    
    console.log('Security context initialized successfully');
  },
  
  // Check rate limit for user
  checkRateLimit(userId) {
    if (!this.rateLimiterSubmit) return true; // Allow if limiter not available
    return this.rateLimiterSubmit.canSubmit(userId);
  },
  
  // Validate log entry before saving
  validateAndQueueLog(logEntry) {
    if (!window.validateLogEntry) {
      return { valid: true, error: null };
    }
    
    const validation = window.validateLogEntry(logEntry);
    
    if (validation.valid && this.offlineQueue) {
      try {
        this.offlineQueue.addToPending(logEntry);
      } catch (error) {
        console.warn('Failed to add to offline queue:', error);
      }
    }
    
    return validation;
  }
};

// Initialize security context when page loads
document.addEventListener('DOMContentLoaded', () => {
  window.securityContext.init();
});

// Patch global error handler to sanitize error messages
const originalOnError = window.onerror;
window.onerror = function(message, source, lineno, colno, error) {
  // Sanitize the error before logging
  const sanitized = window.securityContext.sanitizeError(error || message);
  console.error('Sanitized error:', sanitized);
  
  // Call original handler if it exists
  if (originalOnError) {
    return originalOnError.apply(this, arguments);
  }
  return true;
};

// Export for use in script.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.securityContext;
}
