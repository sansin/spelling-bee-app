/**
 * Security Test Suite
 * Tests for input validation, sanitization, and error handling
 */

describe('Security: Input Validation & Sanitization', () => {
  
  describe('Input Length Validation', () => {
    test('should reject answers longer than max length', () => {
      const maxLength = 100;
      const longAnswer = 'a'.repeat(101);
      const result = validateAnswerLength(longAnswer, maxLength);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
    });

    test('should accept answers within max length', () => {
      const maxLength = 100;
      const validAnswer = 'hello';
      const result = validateAnswerLength(validAnswer, maxLength);
      expect(result.valid).toBe(true);
    });

    test('should handle empty input gracefully', () => {
      const result = validateAnswerLength('', 100);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    test('should trim whitespace', () => {
      const answer = '  hello  ';
      const result = validateAnswerLength(answer, 100);
      expect(result.trimmed).toBe('hello');
    });
  });

  describe('Username Validation', () => {
    test('should reject username with XSS payload', () => {
      const malicious = '<img src=x onerror="alert(1)">';
      const result = validateUsername(malicious);
      expect(result.valid).toBe(false);
    });

    test('should reject username with SQL injection', () => {
      const malicious = "'; DROP TABLE users; --";
      const result = validateUsername(malicious);
      expect(result.valid).toBe(false);
    });

    test('should accept alphanumeric usernames', () => {
      const username = 'john_doe123';
      const result = validateUsername(username);
      expect(result.valid).toBe(true);
    });

    test('should enforce max length for username', () => {
      const longUsername = 'a'.repeat(101);
      const result = validateUsername(longUsername);
      expect(result.valid).toBe(false);
    });
  });

  describe('localStorage Injection Prevention', () => {
    test('should validate log structure before storing', () => {
      const validLog = {
        word: 'example',
        attempt: 'exampl',
        correct: false,
        timestamp: Date.now(),
        timeSpent: 5000,
        sessionId: 123456,
        user: 'testuser',
        grade: 'One Bee',
        testMode: 'practice'
      };
      const result = validateLogEntry(validLog);
      expect(result.valid).toBe(true);
    });

    test('should reject log with missing required fields', () => {
      const invalidLog = {
        word: 'example',
        attempt: 'exampl'
        // missing other required fields
      };
      const result = validateLogEntry(invalidLog);
      expect(result.valid).toBe(false);
    });

    test('should reject log with malicious attempt value', () => {
      const maliciousLog = {
        word: 'example',
        attempt: '<script>alert("xss")</script>',
        correct: false,
        timestamp: Date.now(),
        timeSpent: 5000,
        sessionId: 123456,
        user: 'testuser',
        grade: 'One Bee',
        testMode: 'practice'
      };
      const result = validateLogEntry(maliciousLog);
      expect(result.valid).toBe(false);
    });

    test('should safely parse corrupted localStorage', () => {
      const result = safeJSONParse('invalid json {]');
      expect(result).toEqual({});
    });
  });

  describe('HTML Sanitization', () => {
    test('should escape HTML special characters', () => {
      const input = '<script>alert("xss")</script>';
      const output = escapeHTML(input);
      expect(output).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(output).not.toContain('<script>');
    });

    test('should handle quotes in text', () => {
      const input = 'He said "Hello"';
      const output = escapeHTML(input);
      expect(output).toContain('&quot;');
    });

    test('should preserve safe content', () => {
      const input = 'Simple text with numbers 123';
      const output = escapeHTML(input);
      expect(output).toBe(input);
    });
  });

  describe('API Response Validation', () => {
    test('should validate Free Dictionary API response structure', () => {
      const validResponse = [
        {
          word: 'example',
          meanings: [
            {
              partOfSpeech: 'noun',
              definitions: [
                { definition: 'a thing characteristic of its kind' }
              ]
            }
          ]
        }
      ];
      const result = validateDictionaryAPIResponse(validResponse);
      expect(result.valid).toBe(true);
    });

    test('should reject malformed API response', () => {
      const invalidResponse = [
        {
          word: 'example'
          // missing meanings
        }
      ];
      const result = validateDictionaryAPIResponse(invalidResponse);
      expect(result.valid).toBe(false);
    });

    test('should reject API response without array', () => {
      const invalidResponse = { word: 'example' };
      const result = validateDictionaryAPIResponse(invalidResponse);
      expect(result.valid).toBe(false);
    });

    test('should handle API errors gracefully', () => {
      const errorResponse = null;
      const result = validateDictionaryAPIResponse(errorResponse);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Error Message Sanitization', () => {
    test('should not expose internal error details to user', () => {
      const internalError = 'Failed to fetch from https://api.dictionaryapi.dev/api/v2/entries/en/word with status 500';
      const userMessage = sanitizeErrorMessage(internalError);
      expect(userMessage).not.toContain('https://');
      expect(userMessage).not.toContain('status');
      expect(userMessage).toContain('try again');
    });

    test('should provide helpful user-facing message', () => {
      const internalError = 'TypeError: Cannot read property of undefined';
      const userMessage = sanitizeErrorMessage(internalError);
      expect(userMessage).toBeString();
      expect(userMessage.length).toBeGreaterThan(0);
      expect(userMessage).not.toContain('undefined');
    });
  });

  describe('Rate Limiting', () => {
    test('should prevent rapid-fire submissions', () => {
      const limiter = createRateLimiter(2000); // 2 second cooldown
      
      expect(limiter.canSubmit('user1')).toBe(true);
      expect(limiter.canSubmit('user1')).toBe(false);
      expect(limiter.canSubmit('user1')).toBe(false);
      
      // Wait 2 seconds
      jest.advanceTimersByTime(2000);
      expect(limiter.canSubmit('user1')).toBe(true);
    });

    test('should track different users separately', () => {
      const limiter = createRateLimiter(2000);
      
      expect(limiter.canSubmit('user1')).toBe(true);
      expect(limiter.canSubmit('user2')).toBe(true);
      expect(limiter.canSubmit('user1')).toBe(false);
      expect(limiter.canSubmit('user2')).toBe(false);
    });
  });
});

describe('Security: Offline Queue Management', () => {
  
  describe('Pending Logs Queue', () => {
    test('should add logs to queue when offline', () => {
      const queue = createOfflineQueue(100);
      const log = { word: 'test', attempt: 'test', correct: true };
      
      queue.addToPending(log);
      expect(queue.getPending()).toHaveLength(1);
    });

    test('should respect max queue size', () => {
      const queue = createOfflineQueue(5);
      
      for (let i = 0; i < 10; i++) {
        queue.addToPending({ word: `test${i}`, attempt: 'test', correct: true });
      }
      
      expect(queue.getPending().length).toBeLessThanOrEqual(5);
    });

    test('should drop oldest logs when queue is full', () => {
      const queue = createOfflineQueue(3);
      
      queue.addToPending({ word: 'first', attempt: 'test', correct: true });
      queue.addToPending({ word: 'second', attempt: 'test', correct: true });
      queue.addToPending({ word: 'third', attempt: 'test', correct: true });
      queue.addToPending({ word: 'fourth', attempt: 'test', correct: true });
      
      const pending = queue.getPending();
      expect(pending.length).toBe(3);
      expect(pending[0].word).toBe('second');
    });

    test('should clear queue after sync', () => {
      const queue = createOfflineQueue(100);
      queue.addToPending({ word: 'test', attempt: 'test', correct: true });
      
      queue.clearPending();
      expect(queue.getPending()).toHaveLength(0);
    });
  });
});

describe('Security: Content Security Policy', () => {
  test('should include CSP meta tag in HTML', () => {
    const htmlContent = getIndexHTML();
    expect(htmlContent).toContain('Content-Security-Policy');
    expect(htmlContent).toContain("default-src 'self'");
  });

  test('should restrict script sources', () => {
    const htmlContent = getIndexHTML();
    expect(htmlContent).toContain("script-src 'self'");
  });
});

// Helper test utilities
function getIndexHTML() {
  // This would be loaded from index.html in actual tests
  return fs.readFileSync('index.html', 'utf8');
}

// Test utilities
expect.extend({
  toBeString(received) {
    const pass = typeof received === 'string';
    if (pass) {
      return { message: () => `expected ${received} not to be a string`, pass: true };
    } else {
      return { message: () => `expected ${received} to be a string`, pass: false };
    }
  }
});
