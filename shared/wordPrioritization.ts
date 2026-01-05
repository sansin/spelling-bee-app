/**
 * Word Prioritization Algorithm - Shared across web and mobile
 * 5-factor scoring system for intelligent word selection
 */

import { Word, SpellingLog, WordScore } from './types';

export function getPrioritizedWords(
  words: Word[],
  logs: SpellingLog[],
  grade: string
): Word[] {
  // Filter words by grade
  const filteredWords = words.filter(
    (w) => grade === 'all' || w.grade === grade
  );

  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

  // Calculate a priority score for each word
  const wordScores: WordScore[] = filteredWords.map((word) => {
    const wordLogs = logs.filter((l) => l.word === word.word);
    const wrongLogs = wordLogs.filter((l) => !l.correct);
    const correctLogs = wordLogs.filter((l) => l.correct);

    // If word never attempted, high priority for coverage
    if (wordLogs.length === 0) {
      return { word, score: 100 }; // High priority for new words
    }

    // Calculate mistake frequency (0-50 points)
    const mistakeFrequency = (wrongLogs.length / wordLogs.length) * 50;

    // Calculate recency of mistakes (0-30 points)
    let mistakeRecency = 0;
    if (wrongLogs.length > 0) {
      const lastMistake = wrongLogs[wrongLogs.length - 1].timestamp;
      const daysSinceMistake = (now - lastMistake) / (24 * 60 * 60 * 1000);
      mistakeRecency = Math.max(0, 30 - daysSinceMistake * 2); // Recent mistakes worth more
    }

    // Calculate success streak (words with recent correct answers get lower priority)
    let successStreakPenalty = 0;
    if (correctLogs.length > 0) {
      const lastCorrect = correctLogs[correctLogs.length - 1].timestamp;
      const lastWrong =
        wrongLogs.length > 0 ? wrongLogs[wrongLogs.length - 1].timestamp : 0;

      // If last attempt was correct and recent, lower the priority
      if (lastCorrect > lastWrong) {
        const daysSinceCorrect = (now - lastCorrect) / (24 * 60 * 60 * 1000);
        if (daysSinceCorrect < 7) {
          successStreakPenalty = 20; // Reduce score if recently correct
        }
      }
    }

    // Calculate coverage bonus (words asked less frequently get higher priority)
    const coverageBonus = Math.max(0, 20 - wordLogs.length * 2);

    // Final score calculation
    const totalScore =
      mistakeFrequency +
      mistakeRecency +
      coverageBonus -
      successStreakPenalty;

    return {
      word,
      score: Math.max(0, totalScore),
      wrongCount: wrongLogs.length,
      timesAsked: wordLogs.length,
    };
  });

  // Sort by score (highest first) with randomization for words with similar scores
  wordScores.sort((a, b) => {
    const scoreDiff = b.score - a.score;
    // If scores are within 5 points, randomize to add variety
    if (Math.abs(scoreDiff) < 5) {
      return Math.random() - 0.5;
    }
    return scoreDiff;
  });

  return wordScores.map((ws) => ws.word);
}

/**
 * Helper function to shuffle an array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
