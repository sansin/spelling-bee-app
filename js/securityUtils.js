/**
 * Security Utilities Module
 * Provides input validation, sanitization, and security helper functions
 * 
 * Usage:
 * import { validateAnswerLength, escapeHTML, validateUsername } from './securityUtils.js';
 */

// ============================================================
// INPUT VALIDATION
// ============================================================

/**
 * Validate answer length and content
 * @param {string} answer - User's answer attempt
 * @param {number} maxLength - Maximum allowed length (default: 100)
 * @returns {Object} { valid: boolean, error?: string, trimmed?: string }
 */
export function validateAnswerLength(answer, maxLength = 100) {
  if (typeof answer !== 'string') {
    return { valid: false, error: 'Answer must be text' };
  }

  const trimmed = answer.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Please type an answer before submitting' };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `Answer is too long (max ${maxLength} characters)` };
  }

  return { valid: true, trimmed };
}

/**
 * Validate username for XSS and injection attacks
 * @param {string} username - Username to validate
 * @returns {Object} { valid: boolean, error?: string, sanitized?: string }
 */
export function validateUsername(username) {
  if (typeof username !== 'string') {
    return { valid: false, error: 'Username must be text' };
  }

  const trimmed = username.trim();

  // Check length
  if (trimmed.length === 0) {
    return { valid: false, error: 'Username cannot be empty' };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'Username too long (max 50 characters)' };
  }

  // Allow only alphanumeric, underscore, hyphen
  const safePattern = /^[a-zA-Z0-9_-]+$/;
  if (!safePattern.test(trimmed)) {
    return { 
      valid: false, 
      error: 'Username can only contain letters, numbers, underscore, and hyphen' 
    };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Validate log entry structure before storage
 * @param {Object} logEntry - Log entry to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateLogEntry(logEntry) {
  if (!logEntry || typeof logEntry !== 'object') {
    return { valid: false, error: 'Log entry must be an object' };
  }

  // Required fields
  const requiredFields = ['word', 'attempt', 'correct', 'timestamp', 'timeSpent', 'sessionId', 'user', 'grade'];
  for (const field of requiredFields) {
    if (!(field in logEntry)) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  // Type validation
  if (typeof logEntry.word !== 'string' || logEntry.word.length === 0) {
    return { valid: false, error: 'Invalid word field' };
  }

  if (typeof logEntry.attempt !== 'string') {
    return { valid: false, error: 'Invalid attempt field' };
  }

  if (typeof logEntry.correct !== 'boolean') {
    return { valid: false, error: 'Invalid correct field' };
  }

  if (typeof logEntry.timestamp !== 'number' || logEntry.timestamp <= 0) {
    return { valid: false, error: 'Invalid timestamp' };
  }

  if (typeof logEntry.user !== 'string' || logEntry.user.length === 0) {
    return { valid: false, error: 'Invalid user field' };
  }

  // Sanitize content
  if (logEntry.attempt.length > 100) {
    return { valid: false, error: 'Answer too long' };
  }

  // Check for obvious XSS patterns
  const xssPatterns = ['<script', 'javascript:', 'onerror=', 'onload=', '<img'];
  const fullContent = `${logEntry.word}${logEntry.attempt}${logEntry.user}`;
  if (xssPatterns.some(pattern => fullContent.toLowerCase().includes(pattern))) {
    return { valid: false, error: 'Invalid content detected' };
  }

  return { valid: true };
}

// ============================================================
// SANITIZATION
// ============================================================

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for HTML
 */
export function escapeHTML(text) {
  if (typeof text !== 'string') return '';

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Sanitize error messages to hide internal details
 * @param {string} error - Error message
 * @returns {string} User-friendly message
 */
export function sanitizeErrorMessage(error) {
  if (typeof error !== 'string') {
    return 'Something went wrong. Please try again later.';
  }

  const errorLower = error.toLowerCase();

  // Map technical errors to user-friendly messages
  if (errorLower.includes('timeout')) {
    return 'The request took too long. Please check your connection and try again.';
  }

  if (errorLower.includes('undefined') || errorLower.includes('null')) {
    return 'An unexpected error occurred. Please refresh and try again.';
  }

  if (errorLower.includes('network') || errorLower.includes('fetch')) {
    return 'Unable to connect. Please check your internet connection.';
  }

  if (errorLower.includes('firebase')) {
    return 'Unable to save your progress. Please try again later.';
  }

  if (errorLower.includes('api') || errorLower.includes('definition')) {
    return 'Unable to load definition. Please try again later.';
  }

  // Default generic message
  return 'Something went wrong. Please try again.';
}

// ============================================================
// API VALIDATION
// ============================================================

/**
 * Validate Free Dictionary API response structure
 * @param {any} response - API response to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateDictionaryAPIResponse(response) {
  if (!response) {
    return { valid: false, error: 'No response from API' };
  }

  if (!Array.isArray(response)) {
    return { valid: false, error: 'Invalid API response format' };
  }

  if (response.length === 0) {
    return { valid: false, error: 'No definition found' };
  }

  const entry = response[0];

  if (!entry || typeof entry !== 'object') {
    return { valid: false, error: 'Invalid entry format' };
  }

  if (!entry.meanings || !Array.isArray(entry.meanings) || entry.meanings.length === 0) {
    return { valid: false, error: 'No meanings found' };
  }

  const meaning = entry.meanings[0];
  if (!meaning.definitions || !Array.isArray(meaning.definitions) || meaning.definitions.length === 0) {
    return { valid: false, error: 'No definitions found' };
  }

  if (!meaning.definitions[0].definition || typeof meaning.definitions[0].definition !== 'string') {
    return { valid: false, error: 'Invalid definition format' };
  }

  return { valid: true };
}

// ============================================================
// STORAGE SECURITY
// ============================================================

/**
 * Safely parse JSON from localStorage
 * @param {string} json - JSON string to parse
 * @param {any} defaultValue - Default value if parsing fails (default: {})
 * @returns {any} Parsed object or default value
 */
export function safeJSONParse(json, defaultValue = {}) {
  try {
    if (typeof json !== 'string') return defaultValue;
    return JSON.parse(json);
  } catch (error) {
    console.warn('Failed to parse JSON:', error.message);
    return defaultValue;
  }
}

/**
 * Safely retrieve and validate logs from localStorage
 * @param {string} storageKey - Key to retrieve from localStorage
 * @returns {Array} Validated logs array
 */
export function getSafeLogsFromStorage(storageKey = 'logs') {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return [];

    const parsed = safeJSONParse(stored, []);
    if (!Array.isArray(parsed)) return [];

    // Validate each log entry
    return parsed.filter((log) => {
      const validation = validateLogEntry(log);
      return validation.valid;
    });
  } catch (error) {
    console.error('Error reading logs from storage:', error);
    return [];
  }
}

// ============================================================
// RATE LIMITING
// ============================================================

/**
 * Create a rate limiter for submissions
 * @param {number} cooldownMs - Cooldown period in milliseconds
 * @returns {Object} Rate limiter with canSubmit() method
 */
export function createRateLimiter(cooldownMs = 2000) {
  const lastSubmitTime = {};

  return {
    canSubmit(userId) {
      const now = Date.now();
      const lastTime = lastSubmitTime[userId] || 0;

      if (now - lastTime < cooldownMs) {
        return false;
      }

      lastSubmitTime[userId] = now;
      return true;
    },

    reset(userId) {
      delete lastSubmitTime[userId];
    },

    resetAll() {
      Object.keys(lastSubmitTime).forEach((key) => {
        delete lastSubmitTime[key];
      });
    }
  };
}

// ============================================================
// OFFLINE QUEUE MANAGEMENT
// ============================================================

/**
 * Create an offline queue for pending logs
 * @param {number} maxSize - Maximum queue size (default: 100)
 * @returns {Object} Queue manager with add, get, clear methods
 */
export function createOfflineQueue(maxSize = 100) {
  let queue = [];

  return {
    addToPending(logEntry) {
      // Validate before adding
      const validation = validateLogEntry(logEntry);
      if (!validation.valid) {
        throw new Error(`Invalid log entry: ${validation.error}`);
      }

      queue.push(logEntry);

      // Enforce max size by removing oldest
      if (queue.length > maxSize) {
        const removed = queue.shift();
        console.warn('Offline queue full; removed oldest log:', removed);
      }

      // Persist to localStorage
      this._persist();
    },

    getPending() {
      return [...queue];
    },

    clearPending() {
      queue = [];
      this._persist();
    },

    removePending(index) {
      if (index >= 0 && index < queue.length) {
        queue.splice(index, 1);
        this._persist();
      }
    },

    _persist() {
      try {
        localStorage.setItem('pendingLogs', JSON.stringify(queue));
      } catch (error) {
        console.error('Failed to persist pending logs:', error);
      }
    },

    _restore() {
      try {
        const stored = localStorage.getItem('pendingLogs');
        if (stored) {
          const parsed = safeJSONParse(stored, []);
          queue = Array.isArray(parsed) ? parsed : [];
        }
      } catch (error) {
        console.error('Failed to restore pending logs:', error);
      }
    }
  };
}

// ============================================================
// FETCH WITH TIMEOUT
// ============================================================

/**
 * Fetch with timeout support
 * @param {string} url - URL to fetch
 * @param {number} timeout - Timeout in milliseconds (default: 5000)
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function fetchWithTimeout(url, timeout = 5000, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// ============================================================
// EXPORTS FOR TESTING
// ============================================================

export default {
  validateAnswerLength,
  validateUsername,
  validateLogEntry,
  escapeHTML,
  sanitizeErrorMessage,
  validateDictionaryAPIResponse,
  safeJSONParse,
  getSafeLogsFromStorage,
  createRateLimiter,
  createOfflineQueue,
  fetchWithTimeout
};
