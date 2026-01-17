/**
 * Security Integration Tests
 * Tests the integration of security utilities with the main application
 */

import {
  validateAnswerLength,
  validateUsername,
  validateLogEntry,
  escapeHTML,
  sanitizeErrorMessage,
  createRateLimiter,
  createOfflineQueue
} from '../js/securityUtils.js';

describe('Security Integration - Answer Submission Flow', () => {
  let rateLimiter;
  let offlineQueue;

  beforeEach(() => {
    localStorage.clear();
    rateLimiter = createRateLimiter(1500); // 1.5 second cooldown
    offlineQueue = createOfflineQueue(200);
  });

  describe('Complete submission workflow with security', () => {
    test('should accept and validate correct answer submission', () => {
      // 1. Validate answer length
      const answerValidation = validateAnswerLength('hello');
      expect(answerValidation.valid).toBe(true);
      expect(answerValidation.trimmed).toBe('hello');

      // 2. Check rate limit
      const canSubmit = rateLimiter.canSubmit('user1');
      expect(canSubmit).toBe(true);

      // 3. Create log entry
      const logEntry = {
        word: 'hello',
        attempt: answerValidation.trimmed,
        correct: true,
        timestamp: Date.now(),
        timeSpent: 5000,
        sessionId: 'session123',
        user: 'user1',
        grade: 3,
        testMode: 'practice'
      };

      // 4. Validate log entry
      const logValidation = validateLogEntry(logEntry);
      expect(logValidation.valid).toBe(true);

      // 5. Queue for persistence
      offlineQueue.addToPending(logEntry);
      expect(offlineQueue.getPending().length).toBe(1);
    });

    test('should reject empty answer without rate limit', () => {
      const answerValidation = validateAnswerLength('   ');
      expect(answerValidation.valid).toBe(false);

      // Rate limiter should not be consumed
      expect(rateLimiter.canSubmit('user1')).toBe(true);
    });

    test('should block rapid-fire submissions from same user', () => {
      const userId = 'user1';
      
      // First submission allowed
      expect(rateLimiter.canSubmit(userId)).toBe(true);
      
      // Second submission blocked (within 1.5s)
      expect(rateLimiter.canSubmit(userId)).toBe(false);
      expect(rateLimiter.canSubmit(userId)).toBe(false);
    });

    test('should allow different users to submit simultaneously', () => {
      expect(rateLimiter.canSubmit('user1')).toBe(true);
      expect(rateLimiter.canSubmit('user2')).toBe(true);
      expect(rateLimiter.canSubmit('user3')).toBe(true);

      // But each user is individually rate limited
      expect(rateLimiter.canSubmit('user1')).toBe(false);
      expect(rateLimiter.canSubmit('user2')).toBe(false);
      expect(rateLimiter.canSubmit('user3')).toBe(false);
    });

    test('should validate XSS attempt in answer', () => {
      const xssAnswer = '<script>alert("xss")</script>';
      
      // Length validation succeeds (passed through)
      const lengthValidation = validateAnswerLength(xssAnswer);
      expect(lengthValidation.valid).toBe(true);

      // Escape HTML for display
      const escaped = escapeHTML(lengthValidation.trimmed);
      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;script&gt;');
    });

    test('should handle offline queue overflow gracefully', () => {
      const tinyQueue = createOfflineQueue(2);
      const baseLog = {
        word: 'test',
        attempt: 'test',
        correct: true,
        timestamp: Date.now(),
        timeSpent: 1000,
        sessionId: 'sess',
        user: 'user',
        grade: 3
      };

      tinyQueue.addToPending(baseLog);
      tinyQueue.addToPending({ ...baseLog, word: 'test2' });
      tinyQueue.addToPending({ ...baseLog, word: 'test3' }); // Overflow

      const pending = tinyQueue.getPending();
      expect(pending.length).toBe(2);
      expect(pending[0].word).toBe('test2'); // Oldest removed
    });
  });

  describe('Error handling and sanitization', () => {
    test('should sanitize Firebase errors', () => {
      const firebaseError = 'Firebase: PERMISSION_DENIED (auth/operation-not-allowed)';
      const sanitized = sanitizeErrorMessage(firebaseError);
      
      expect(sanitized).not.toContain('PERMISSION_DENIED');
      expect(sanitized).not.toContain('Firebase');
      expect(sanitized.length > 0).toBe(true);
    });

    test('should sanitize network errors', () => {
      const networkError = 'Failed to fetch from https://api.example.com/def';
      const sanitized = sanitizeErrorMessage(networkError);
      
      expect(sanitized).not.toContain('https://');
      expect(sanitized).not.toContain('example.com');
    });

    test('should sanitize API timeout errors', () => {
      const timeoutError = 'Request timeout after 5000ms';
      const sanitized = sanitizeErrorMessage(timeoutError);
      
      expect(sanitized).toContain('took too long');
    });

    test('should provide generic fallback for unknown errors', () => {
      const unknownError = 'Some random error xyz123';
      const sanitized = sanitizeErrorMessage(unknownError);
      
      expect(sanitized).not.toContain('xyz123');
      expect(sanitized).toBe('Something went wrong. Please try again.');
    });
  });

  describe('Username validation and sanitization', () => {
    test('should validate safe usernames', () => {
      const validNames = [
        'john_doe',
        'user-123',
        'TestUser',
        'abc123XYZ'
      ];

      validNames.forEach(name => {
        const result = validateUsername(name);
        expect(result.valid).toBe(true);
      });
    });

    test('should reject usernames with special characters', () => {
      const invalidNames = [
        'user@domain',
        'user<script>',
        'user with spaces',
        'user/admin',
        'user;drop',
        'user\'s name'
      ];

      invalidNames.forEach(name => {
        const result = validateUsername(name);
        expect(result.valid).toBe(false);
      });
    });

    test('should enforce username length limits', () => {
      const tooLong = 'a'.repeat(51);
      const result = validateUsername(tooLong);
      
      expect(result.valid).toBe(false);
    });

    test('should trim whitespace from valid usernames', () => {
      const result = validateUsername('  validuser  ');
      
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('validuser');
    });
  });

  describe('Log entry validation in batch', () => {
    test('should validate multiple log entries for batch persistence', () => {
      const logs = [
        {
          word: 'cat',
          attempt: 'cat',
          correct: true,
          timestamp: Date.now(),
          timeSpent: 2000,
          sessionId: 'sess1',
          user: 'user1',
          grade: 2
        },
        {
          word: 'dog',
          attempt: 'dog',
          correct: true,
          timestamp: Date.now(),
          timeSpent: 3000,
          sessionId: 'sess1',
          user: 'user1',
          grade: 2
        },
        {
          word: 'elephant',
          attempt: 'elefant',
          correct: false,
          timestamp: Date.now(),
          timeSpent: 8000,
          sessionId: 'sess1',
          user: 'user1',
          grade: 4
        }
      ];

      const validLogs = logs.filter(log => {
        return validateLogEntry(log).valid;
      });

      expect(validLogs.length).toBe(3);
    });

    test('should filter out invalid log entries from batch', () => {
      const logs = [
        { word: 'valid', attempt: 'valid', correct: true, timestamp: Date.now(), timeSpent: 1000, sessionId: 'sess', user: 'user', grade: 1 },
        { word: 'invalid' }, // Missing required fields
        { word: 'also_valid', attempt: 'also_valid', correct: false, timestamp: Date.now(), timeSpent: 2000, sessionId: 'sess', user: 'user', grade: 2 }
      ];

      const validLogs = logs.filter(log => {
        return validateLogEntry(log).valid;
      });

      expect(validLogs.length).toBe(2);
    });
  });

  describe('Storage security', () => {
    test('should persist validated logs to offline queue', () => {
      const logEntry = {
        word: 'hello',
        attempt: 'hello',
        correct: true,
        timestamp: Date.now(),
        timeSpent: 3000,
        sessionId: 'sess1',
        user: 'user1',
        grade: 2
      };

      offlineQueue.addToPending(logEntry);
      const pending = offlineQueue.getPending();

      expect(pending.length).toBe(1);
      expect(pending[0].word).toBe('hello');

      // Check localStorage was updated
      const stored = localStorage.getItem('pendingLogs');
      expect(stored).toBeTruthy();
    });

    test('should prevent invalid logs from being queued', () => {
      const invalidLog = {
        word: 'test'
        // Missing required fields
      };

      expect(() => {
        offlineQueue.addToPending(invalidLog);
      }).toThrow();

      expect(offlineQueue.getPending().length).toBe(0);
    });
  });

  describe('Security headers and CSP context', () => {
    test('should provide escaped output for HTML rendering', () => {
      const userInput = '<div class="test" data-value="malicious">Content</div>';
      const escaped = escapeHTML(userInput);

      // Verify HTML is neutralized
      expect(escaped).toContain('&lt;div');
      expect(escaped).toContain('&gt;');
      expect(escaped).not.toContain('<div');
    });

    test('should handle unicode and special HTML entities', () => {
      const inputs = [
        { input: '&nbsp;', expected: '&amp;nbsp;' },
        { input: '"quoted"', expected: '&quot;quoted&quot;' },
        { input: "'apostrophe'", expected: '&#039;apostrophe&#039;' },
        { input: 'A&B', expected: 'A&amp;B' }
      ];

      inputs.forEach(({ input, expected }) => {
        const result = escapeHTML(input);
        expect(result).toBe(expected);
      });
    });
  });
});

describe('Security Integration - Offline Support', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should restore pending logs from localStorage on reload', () => {
    const originalQueue = createOfflineQueue(50);
    const logEntry = {
      word: 'test',
      attempt: 'test',
      correct: true,
      timestamp: Date.now(),
      timeSpent: 1000,
      sessionId: 'sess',
      user: 'user',
      grade: 1
    };

    originalQueue.addToPending(logEntry);

    // Simulate reload by creating new queue (would normally restore from localStorage)
    const restoredData = localStorage.getItem('pendingLogs');
    expect(restoredData).toBeTruthy();

    const restored = JSON.parse(restoredData);
    expect(restored.length).toBe(1);
    expect(restored[0].word).toBe('test');
  });

  test('should handle corrupted offline queue gracefully', () => {
    // Corrupt the stored data
    localStorage.setItem('pendingLogs', 'corrupted data {]');

    // Creating a new queue should not throw
    const queue = createOfflineQueue(50);
    expect(() => {
      queue.getPending();
    }).not.toThrow();
  });
});

describe('Security Integration - Complete User Journey', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should safely process user login with validation', () => {
    const username = 'testuser_123';
    
    // Validate username
    const validation = validateUsername(username);
    expect(validation.valid).toBe(true);
    expect(validation.sanitized).toBe(username);

    // Store securely
    localStorage.setItem('currentUser', validation.sanitized);
    expect(localStorage.getItem('currentUser')).toBe(username);
  });

  test('should handle complete practice session with security', () => {
    const userId = 'testuser';
    const sessionId = 'session_' + Date.now();
    const rateLimiter = createRateLimiter(1500);
    const offlineQueue = createOfflineQueue(100);

    const words = ['cat', 'dog', 'elephant'];
    const sessionLogs = [];

    words.forEach((word) => {
      // Check rate limit
      const canSubmit = rateLimiter.canSubmit(userId);
      if (!canSubmit) return; // Skip if rate limited

      // Validate answer
      const answerValidation = validateAnswerLength(word);
      if (!answerValidation.valid) return;

      // Create log
      const logEntry = {
        word: word,
        attempt: word,
        correct: true,
        timestamp: Date.now(),
        timeSpent: 3000,
        sessionId: sessionId,
        user: userId,
        grade: 2,
        testMode: 'practice'
      };

      // Validate and queue
      const logValidation = validateLogEntry(logEntry);
      if (logValidation.valid) {
        offlineQueue.addToPending(logEntry);
        sessionLogs.push(logEntry);
      }
    });

    // Verify results
    expect(sessionLogs.length).toBeGreaterThan(0);
    expect(offlineQueue.getPending().length).toBe(sessionLogs.length);
  });
});
