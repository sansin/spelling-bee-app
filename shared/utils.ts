/**
 * Shared Utility Functions - Used by web and mobile
 */

import { SpellingLog, AnalyticsData, WordStats } from './types';

/**
 * Calculate analytics from spelling logs
 */
export function calculateAnalytics(logs: SpellingLog[], words: any[]): AnalyticsData {
  const total = logs.length;
  const correctCount = logs.filter((l) => l.correct).length;
  const incorrectCount = total - correctCount;
  const accuracy = total > 0 ? ((correctCount / total) * 100).toFixed(2) : '0';

  // Session accuracy
  const sessions = [...new Set(logs.map((l) => l.sessionId))];
  const sessionAccuracy = sessions.map((sid) => {
    const sLogs = logs.filter((l) => l.sessionId === sid);
    return (sLogs.filter((l) => l.correct).length / sLogs.length) * 100;
  });

  // Time analytics
  const totalTimeMs = logs.reduce((sum, l) => sum + (l.timeSpent || 0), 0);
  const avgTimePerWord = Math.round(totalTimeMs / total / 1000);

  // Wrong words
  const wrongWordStats: { [key: string]: WordStats } = {};
  logs.forEach((log) => {
    if (!wrongWordStats[log.word]) {
      wrongWordStats[log.word] = {
        word: log.word,
        wrong: 0,
        correct: 0,
        timesAsked: 0,
        totalTime: 0,
        successRate: 0,
      };
    }
    if (!log.correct) {
      wrongWordStats[log.word].wrong++;
    } else {
      wrongWordStats[log.word].correct++;
    }
    wrongWordStats[log.word].timesAsked++;
    wrongWordStats[log.word].totalTime += log.timeSpent || 0;
  });

  // Calculate success rates
  Object.keys(wrongWordStats).forEach((word) => {
    const stats = wrongWordStats[word];
    stats.successRate = parseFloat(
      ((stats.correct / stats.timesAsked) * 100).toFixed(0)
    );
  });

  const sortedWrongWords = Object.entries(wrongWordStats)
    .sort((a, b) => b[1].wrong - a[1].wrong)
    .slice(0, 10)
    .map(([word, stats]) => ({ word, stats }));

  // Correct words
  const correctWordStats: { [key: string]: WordStats } = {};
  logs.forEach((log) => {
    if (log.correct) {
      if (!correctWordStats[log.word]) {
        correctWordStats[log.word] = {
          word: log.word,
          wrong: 0,
          correct: 0,
          timesAsked: 0,
          totalTime: 0,
          successRate: 100,
        };
      }
      correctWordStats[log.word].correct++;
      correctWordStats[log.word].timesAsked++;
      correctWordStats[log.word].totalTime += log.timeSpent || 0;
    }
  });

  const sortedCorrectWords = Object.entries(correctWordStats)
    .sort((a, b) => b[1].correct - a[1].correct)
    .slice(0, 10)
    .map(([word, stats]) => ({ word, stats }));

  return {
    total,
    correctCount,
    incorrectCount,
    accuracy: parseFloat(accuracy),
    sessions,
    sessionAccuracy,
    avgTimePerWord,
    totalTimeMs,
    wrongWords: sortedWrongWords,
    correctWords: sortedCorrectWords,
  };
}

/**
 * Fetch word definition from Free Dictionary API
 */
export async function fetchDefinition(word: string) {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`
    );

    if (!response.ok) {
      throw new Error('Definition not found');
    }

    const data = await response.json();
    const entry = data[0];

    if (!entry.meanings || entry.meanings.length === 0) {
      throw new Error('No meanings available');
    }

    const meaning = entry.meanings[0];
    const definition = meaning.definitions[0]?.definition || '';
    const example = meaning.definitions[0]?.example || '';
    const partOfSpeech = meaning.partOfSpeech || '';
    const phonetic = entry.phonetic || '';

    return {
      word,
      phonetic,
      partOfSpeech,
      definition,
      example,
    };
  } catch (error) {
    console.error('Error fetching definition:', error);
    throw error;
  }
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format time in milliseconds to readable string
 */
export function formatTime(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Get accuracy percentage from logs
 */
export function getAccuracy(logs: SpellingLog[]): number {
  if (logs.length === 0) return 0;
  const correctCount = logs.filter((l) => l.correct).length;
  return Math.round((correctCount / logs.length) * 100);
}
