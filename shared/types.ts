/**
 * Shared TypeScript Types - Used by web and mobile
 */

export interface Word {
  id: number;
  grade: string;
  word: string;
}

export interface SpellingLog {
  id?: string;
  word: string;
  correct: boolean;
  attempt: string;
  timeSpent: number;
  timestamp: number;
  sessionId: string;
}

export interface UserSession {
  sessionId: string;
  username: string;
  grade: string;
  startTime: number;
  endTime?: number;
  totalQuestions: number;
  correctCount: number;
  logs: SpellingLog[];
}

export interface UserProfile {
  username: string;
  totalSessions: number;
  totalAttempts: number;
  correctAttempts: number;
  createdAt: number;
  lastActive: number;
}

export interface WordScore {
  word: Word;
  score: number;
  wrongCount?: number;
  timesAsked?: number;
}

export interface Definition {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  example: string;
}

export interface AnalyticsData {
  total: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  sessions: string[];
  sessionAccuracy: number[];
  avgTimePerWord: number;
  totalTimeMs: number;
  wrongWords: Array<{ word: string; stats: WordStats }>;
  correctWords: Array<{ word: string; stats: WordStats }>;
}

export interface WordStats {
  word: string;
  wrong: number;
  correct: number;
  timesAsked: number;
  totalTime: number;
  successRate: number;
}
