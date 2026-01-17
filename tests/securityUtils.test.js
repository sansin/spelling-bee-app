/**
 * Security Utilities Test Suite
 * Tests for input validation, sanitization, and security functions
 */

import {
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
} from '../js/securityUtils.js';

describe('Security Utilities - Input Validation', () => {
  describe('validateAnswerLength', () => {
    test('should accept valid answers', () => {
      const result = validateAnswerLength('cat');
      expect(result.valid).toBe(true);
      expect(result.trimmed).toBe('cat');
    });

    test('should reject non-string inputs', () => {
      const result = validateAnswerLength(123);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Answer must be text');
    });

    test('should reject empty or whitespace-only answers', () => {
      const result = validateAnswerLength('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Please type an answer before submitting');
    });

    test('should reject answers exceeding max length', () => {
      const longAnswer = 'a'.repeat(101);
      const result = validateAnswerLength(longAnswer);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
    });

    test('should trim whitespace from valid answers', () => {
      const result = validateAnswerLength('  hello  ');
      expect(result.valid).toBe(true);
      expect(result.trimmed).toBe('hello');
    });

    test('should accept custom max length', () => {
      const result = validateAnswerLength('hello', 3);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateUsername', () => {
    test('should accept valid alphanumeric usernames', () => {
      const result = validateUsername('user123');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('user123');
    });

    test('should accept underscores and hyphens', () => {
      const result = validateUsername('user_name-123');
      expect(result.valid).toBe(true);
    });

    test('should reject non-string inputs', () => {
      const result = validateUsername(123);
      expect(result.valid).toBe(false);
    });

    test('should reject empty usernames', () => {
      const result = validateUsername('');
      expect(result.valid).toBe(false);
    });

    test('should reject usernames exceeding 50 characters', () => {
      const longUsername = 'a'.repeat(51);
      const result = validateUsername(longUsername);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
    });

    test('should reject special characters', () => {
      const result = validateUsername('user@domain');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('can only contain');
    });

    test('should reject XSS payloads', () => {
      const result = validateUsername('<script>alert("xss")</script>');
      expect(result.valid).toBe(false);
    });

    test('should trim whitespace', () => {
      const result = validateUsername('  validuser  ');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('validuser');
    });
  });

  describe('validateLogEntry', () => {
    const validLogEntry = {
      word: 'hello',
      attempt: 'helo',
      correct: false,
      timestamp: Date.now(),
      timeSpent: 5000,
      sessionId: 'session123',
      user: 'testuser',
      grade: 3
    };

    test('should accept valid log entries', () => {
      const result = validateLogEntry(validLogEntry);
      expect(result.valid).toBe(true);
    });

    test('should reject non-object inputs', () => {
      const result = validateLogEntry('not an object');
      expect(result.valid).toBe(false);
    });

    test('should reject entries with missing fields', () => {
      const incomplete = { ...validLogEntry };
      delete incomplete.word;
      const result = validateLogEntry(incomplete);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing required field');
    });

    test('should reject invalid word field', () => {
      const result = validateLogEntry({ ...validLogEntry, word: '' });
      expect(result.valid).toBe(false);
    });

    test('should reject invalid timestamp', () => {
      const result = validateLogEntry({ ...validLogEntry, timestamp: -100 });
      expect(result.valid).toBe(false);
    });

    test('should reject overly long attempts', () => {
      const result = validateLogEntry({
        ...validLogEntry,
        attempt: 'a'.repeat(101)
      });
      expect(result.valid).toBe(false);
    });

    test('should reject XSS patterns in content', () => {
      const result = validateLogEntry({
        ...validLogEntry,
        attempt: '<script>alert("xss")</script>'
      });
      expect(result.valid).toBe(false);
    });

    test('should reject non-boolean correct field', () => {
      const result = validateLogEntry({ ...validLogEntry, correct: 'true' });
      expect(result.valid).toBe(false);
    });
  });
});

describe('Security Utilities - Sanitization', () => {
  describe('escapeHTML', () => {
    test('should escape HTML special characters', () => {
      const result = escapeHTML('<script>alert("xss")</script>');
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    test('should escape ampersands', () => {
      const result = escapeHTML('AT&T');
      expect(result).toBe('AT&amp;T');
    });

    test('should escape single quotes', () => {
      const result = escapeHTML("it's");
      expect(result).toBe('it&#039;s');
    });

    test('should handle mixed special characters', () => {
      const result = escapeHTML('<div class="test">\'test\'</div>');
      expect(result).toContain('&lt;div');
      expect(result).toContain('&gt;');
      expect(result).toContain('&quot;');
    });

    test('should handle non-string inputs gracefully', () => {
      const result = escapeHTML(123);
      expect(result).toBe('');
    });

    test('should not double-escape', () => {
      const result = escapeHTML('&amp;');
      expect(result).toBe('&amp;amp;');
    });
  });

  describe('sanitizeErrorMessage', () => {
    test('should hide timeout errors', () => {
      const result = sanitizeErrorMessage('Timeout after 5000ms');
      expect(result).toContain('took too long');
    });

    test('should hide undefined errors', () => {
      const result = sanitizeErrorMessage('Cannot read property of undefined');
      expect(result).not.toContain('undefined');
    });

    test('should hide network errors', () => {
      const result = sanitizeErrorMessage('Network request failed');
      expect(result).toContain('check your internet');
    });

    test('should hide Firebase errors', () => {
      const result = sanitizeErrorMessage('Firebase: PERMISSION_DENIED');
      expect(result).not.toContain('Firebase');
    });

    test('should hide API errors', () => {
      const result = sanitizeErrorMessage('API returned 500');
      expect(result).toContain('try again later');
    });

    test('should return generic message for unknown errors', () => {
      const result = sanitizeErrorMessage('Some random error message');
      expect(result).toBe('Something went wrong. Please try again.');
    });

    test('should handle non-string inputs', () => {
      const result = sanitizeErrorMessage(123);
      expect(typeof result).toBe('string');
    });
  });
});

describe('Security Utilities - API Validation', () => {
  const validDictionaryResponse = [
    {
      word: 'hello',
      meanings: [
        {
          partOfSpeech: 'interjection',
          definitions: [
            {
              definition: 'a polite expression of greeting or of beginning a conversation'
            }
          ]
        }
      ]
    }
  ];

  describe('validateDictionaryAPIResponse', () => {
    test('should accept valid dictionary responses', () => {
      const result = validateDictionaryAPIResponse(validDictionaryResponse);
      expect(result.valid).toBe(true);
    });

    test('should reject null/undefined responses', () => {
      const result = validateDictionaryAPIResponse(null);
      expect(result.valid).toBe(false);
    });

    test('should reject non-array responses', () => {
      const result = validateDictionaryAPIResponse({ word: 'test' });
      expect(result.valid).toBe(false);
    });

    test('should reject empty arrays', () => {
      const result = validateDictionaryAPIResponse([]);
      expect(result.valid).toBe(false);
    });

    test('should reject responses with invalid entry format', () => {
      const result = validateDictionaryAPIResponse([null]);
      expect(result.valid).toBe(false);
    });

    test('should reject responses without meanings', () => {
      const result = validateDictionaryAPIResponse([{ word: 'test' }]);
      expect(result.valid).toBe(false);
    });

    test('should reject responses without definitions', () => {
      const result = validateDictionaryAPIResponse([
        {
          word: 'test',
          meanings: [{ partOfSpeech: 'noun' }]
        }
      ]);
      expect(result.valid).toBe(false);
    });

    test('should reject responses with invalid definition format', () => {
      const result = validateDictionaryAPIResponse([
        {
          word: 'test',
          meanings: [{ definitions: [{ definition: null }] }]
        }
      ]);
      expect(result.valid).toBe(false);
    });
  });
});

describe('Security Utilities - Storage', () => {
  describe('safeJSONParse', () => {
    test('should parse valid JSON strings', () => {
      const result = safeJSONParse('{"key": "value"}');
      expect(result.key).toBe('value');
    });

    test('should return default value for invalid JSON', () => {
      const result = safeJSONParse('not json', { default: true });
      expect(result.default).toBe(true);
    });

    test('should use empty object as default if not specified', () => {
      const result = safeJSONParse('invalid');
      expect(result).toEqual({});
    });

    test('should handle non-string inputs', () => {
      const result = safeJSONParse(123);
      expect(result).toEqual({});
    });

    test('should handle null values', () => {
      const result = safeJSONParse(null);
      expect(result).toEqual({});
    });

    test('should parse valid arrays', () => {
      const result = safeJSONParse('[1,2,3]');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getSafeLogsFromStorage', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    test('should return empty array when no logs stored', () => {
      const result = getSafeLogsFromStorage();
      expect(result).toEqual([]);
    });

    test('should filter out invalid log entries', () => {
      const validLog = {
        word: 'test',
        attempt: 'test',
        correct: true,
        timestamp: Date.now(),
        timeSpent: 1000,
        sessionId: 'sess',
        user: 'user',
        grade: 3
      };
      const invalidLog = { word: 'test' }; // Missing fields

      localStorage.setItem('logs', JSON.stringify([validLog, invalidLog]));
      const result = getSafeLogsFromStorage();
      
      expect(result.length).toBe(1);
      expect(result[0].word).toBe('test');
    });

    test('should handle corrupted storage data', () => {
      localStorage.setItem('logs', 'corrupted json {]');
      const result = getSafeLogsFromStorage();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

describe('Security Utilities - Rate Limiting', () => {
  describe('createRateLimiter', () => {
    test('should allow initial submission', () => {
      const limiter = createRateLimiter(2000);
      expect(limiter.canSubmit('user1')).toBe(true);
    });

    test('should block submission within cooldown period', () => {
      const limiter = createRateLimiter(2000);
      limiter.canSubmit('user1');
      expect(limiter.canSubmit('user1')).toBe(false);
    });

    test('should allow submission after cooldown', (done) => {
      const limiter = createRateLimiter(100);
      limiter.canSubmit('user1');
      
      setTimeout(() => {
        expect(limiter.canSubmit('user1')).toBe(true);
        done();
      }, 150);
    });

    test('should handle multiple users independently', () => {
      const limiter = createRateLimiter(2000);
      limiter.canSubmit('user1');
      
      expect(limiter.canSubmit('user2')).toBe(true);
      expect(limiter.canSubmit('user1')).toBe(false);
    });

    test('should reset user rate limit', () => {
      const limiter = createRateLimiter(2000);
      limiter.canSubmit('user1');
      limiter.reset('user1');
      
      expect(limiter.canSubmit('user1')).toBe(true);
    });

    test('should reset all rate limits', () => {
      const limiter = createRateLimiter(2000);
      limiter.canSubmit('user1');
      limiter.canSubmit('user2');
      limiter.resetAll();
      
      expect(limiter.canSubmit('user1')).toBe(true);
      expect(limiter.canSubmit('user2')).toBe(true);
    });
  });
});

describe('Security Utilities - Offline Queue', () => {
  describe('createOfflineQueue', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    test('should create empty queue', () => {
      const queue = createOfflineQueue();
      expect(queue.getPending()).toEqual([]);
    });

    test('should add valid log entries to queue', () => {
      const queue = createOfflineQueue();
      const logEntry = {
        word: 'test',
        attempt: 'test',
        correct: true,
        timestamp: Date.now(),
        timeSpent: 1000,
        sessionId: 'sess',
        user: 'user',
        grade: 3
      };

      queue.addToPending(logEntry);
      expect(queue.getPending().length).toBe(1);
    });

    test('should reject invalid log entries', () => {
      const queue = createOfflineQueue();
      expect(() => {
        queue.addToPending({ word: 'test' });
      }).toThrow();
    });

    test('should enforce max queue size', () => {
      const queue = createOfflineQueue(2);
      const logEntry = {
        word: 'test',
        attempt: 'test',
        correct: true,
        timestamp: Date.now(),
        timeSpent: 1000,
        sessionId: 'sess',
        user: 'user',
        grade: 3
      };

      queue.addToPending(logEntry);
      queue.addToPending({ ...logEntry, word: 'test2' });
      queue.addToPending({ ...logEntry, word: 'test3' });

      const pending = queue.getPending();
      expect(pending.length).toBe(2);
      expect(pending[0].word).toBe('test2');
    });

    test('should clear pending logs', () => {
      const queue = createOfflineQueue();
      const logEntry = {
        word: 'test',
        attempt: 'test',
        correct: true,
        timestamp: Date.now(),
        timeSpent: 1000,
        sessionId: 'sess',
        user: 'user',
        grade: 3
      };

      queue.addToPending(logEntry);
      queue.clearPending();
      expect(queue.getPending()).toEqual([]);
    });

    test('should remove specific pending log', () => {
      const queue = createOfflineQueue();
      const logEntry = {
        word: 'test',
        attempt: 'test',
        correct: true,
        timestamp: Date.now(),
        timeSpent: 1000,
        sessionId: 'sess',
        user: 'user',
        grade: 3
      };

      queue.addToPending(logEntry);
      queue.addToPending({ ...logEntry, word: 'test2' });
      queue.removePending(0);

      const pending = queue.getPending();
      expect(pending.length).toBe(1);
      expect(pending[0].word).toBe('test2');
    });

    test('should persist queue to localStorage', () => {
      const queue = createOfflineQueue();
      const logEntry = {
        word: 'test',
        attempt: 'test',
        correct: true,
        timestamp: Date.now(),
        timeSpent: 1000,
        sessionId: 'sess',
        user: 'user',
        grade: 3
      };

      queue.addToPending(logEntry);
      const stored = localStorage.getItem('pendingLogs');
      expect(stored).toBeTruthy();
    });
  });
});

describe('Security Utilities - Fetch with Timeout', () => {
  describe('fetchWithTimeout', () => {
    test('should complete successful requests', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
      
      const response = await fetchWithTimeout('http://example.com');
      expect(response.ok).toBe(true);
    });

    test('should propagate non-timeout errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      await expect(fetchWithTimeout('http://example.com'))
        .rejects
        .toThrow('Network error');
    });

    test('should pass additional options to fetch', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true });
      
      await fetchWithTimeout('http://example.com', 5000, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://example.com',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });
  });
});

describe('Security Utilities - Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should validate, sanitize, and store logs securely', () => {
    const queue = createOfflineQueue();
    
    const logEntry = {
      word: 'hello',
      attempt: 'helo',
      correct: false,
      timestamp: Date.now(),
      timeSpent: 5000,
      sessionId: 'session123',
      user: 'testuser',
      grade: 3
    };

    queue.addToPending(logEntry);
    const pending = queue.getPending();
    
    expect(pending.length).toBe(1);
    expect(pending[0].word).toBe('hello');
  });

  test('should handle XSS attempt in complete workflow', () => {
    const answerResult = validateAnswerLength('<script>alert("xss")</script>');
    expect(answerResult.valid).toBe(true);
    
    const escaped = escapeHTML(answerResult.trimmed);
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
  });

  test('should block rate-limited submissions and sanitize errors', () => {
    const limiter = createRateLimiter(2000);
    const firstSubmit = limiter.canSubmit('user1');
    const secondSubmit = limiter.canSubmit('user1');
    
    expect(firstSubmit).toBe(true);
    expect(secondSubmit).toBe(false);
  });
});
