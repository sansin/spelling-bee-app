/**
 * Gamification System - Shared Module
 * Handles badges, streaks, leaderboards, and rewards
 */

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  category: 'accuracy' | 'streak' | 'speed' | 'volume';
  unlocked: boolean;
  unlockedDate?: number;
}

export interface Streak {
  daily: number;
  weekly: number;
  monthly: number;
  lastActiveDate: number;
  currentStreak: number;
  longestStreak: number;
}

export interface UserStats {
  username: string;
  level: number;
  totalPoints: number;
  accuracy: number;
  sessionsCompleted: number;
  wordsCorrect: number;
  wordsIncorrect: number;
  longestWord: string;
  fastestTime: number;
  slowestTime: number;
  badges: Badge[];
  streaks: Streak;
  leaderboardRank?: number;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  points: number;
  level: number;
  accuracy: number;
  sessionsCompleted: number;
}

/**
 * Calculate user points based on performance
 */
export function calculatePoints(
  correct: boolean,
  timeSpent: number,
  difficulty: 'Easy' | 'Medium' | 'Hard'
): number {
  let points = 0;

  if (correct) {
    // Base points by difficulty
    const difficultyPoints = {
      Easy: 10,
      Medium: 20,
      Hard: 30,
    };
    points = difficultyPoints[difficulty];

    // Speed bonus (faster = more points, max 10 bonus)
    const speedBonus = Math.max(0, 10 - Math.floor(timeSpent / 1000));
    points += speedBonus;
  }

  return points;
}

/**
 * Calculate user level based on total points
 */
export function calculateLevel(totalPoints: number): number {
  return Math.floor(Math.sqrt(totalPoints / 100)) + 1;
}

/**
 * Check and award badges
 */
export function checkBadges(stats: UserStats): Badge[] {
  const newBadges: Badge[] = [...stats.badges];

  const badgesList: Badge[] = [
    {
      id: 'first-word',
      name: '🐝 First Buzz',
      description: 'Spell your first word correctly',
      icon: '🐝',
      requirement: 1,
      category: 'volume',
      unlocked: stats.wordsCorrect >= 1,
    },
    {
      id: 'ten-correct',
      name: '⭐ Rising Star',
      description: 'Spell 10 words correctly',
      icon: '⭐',
      requirement: 10,
      category: 'volume',
      unlocked: stats.wordsCorrect >= 10,
    },
    {
      id: 'perfect-session',
      name: '🎯 Perfect Hive',
      description: 'Get 100% accuracy in a session',
      icon: '🎯',
      requirement: 1,
      category: 'accuracy',
      unlocked: stats.accuracy >= 100,
    },
    {
      id: 'ninety-accuracy',
      name: '✨ Accuracy Master',
      description: 'Maintain 90%+ accuracy',
      icon: '✨',
      requirement: 90,
      category: 'accuracy',
      unlocked: stats.accuracy >= 90,
    },
    {
      id: 'speed-demon',
      name: '⚡ Speed Bee',
      description: 'Spell a word in under 5 seconds',
      icon: '⚡',
      requirement: 5000,
      category: 'speed',
      unlocked: stats.fastestTime < 5000,
    },
    {
      id: 'week-streak',
      name: '🔥 Weekly Warrior',
      description: 'Maintain a 7-day streak',
      icon: '🔥',
      requirement: 7,
      category: 'streak',
      unlocked: stats.streaks.currentStreak >= 7,
    },
    {
      id: 'hundred-words',
      name: '🏆 Champion',
      description: 'Spell 100 words correctly',
      icon: '🏆',
      requirement: 100,
      category: 'volume',
      unlocked: stats.wordsCorrect >= 100,
    },
    {
      id: 'month-streak',
      name: '👑 Legendary',
      description: 'Maintain a 30-day streak',
      icon: '👑',
      requirement: 30,
      category: 'streak',
      unlocked: stats.streaks.longestStreak >= 30,
    },
  ];

  // Update badges
  badgesList.forEach((badge) => {
    const existingBadge = newBadges.find((b) => b.id === badge.id);
    if (!existingBadge && badge.unlocked) {
      newBadges.push({ ...badge, unlockedDate: Date.now() });
    }
  });

  return newBadges;
}

/**
 * Update user streak
 */
export function updateStreak(
  currentStreak: Streak,
  isCorrect: boolean
): Streak {
  const today = new Date().toDateString();
  const lastActiveDate = new Date(currentStreak.lastActiveDate).toDateString();

  let newStreak = { ...currentStreak };

  if (isCorrect) {
    // If user practiced today, increment current streak
    if (today === lastActiveDate) {
      newStreak.daily++;
    } else if (
      new Date().getTime() - currentStreak.lastActiveDate <
      24 * 60 * 60 * 1000 + 60000
    ) {
      // If less than 24 hours + 1 min, continue streak
      newStreak.currentStreak++;
      newStreak.daily = 1;
    } else {
      // Streak broken, restart
      newStreak.currentStreak = 1;
      newStreak.daily = 1;
    }

    // Update longest streak
    if (newStreak.currentStreak > newStreak.longestStreak) {
      newStreak.longestStreak = newStreak.currentStreak;
    }

    newStreak.lastActiveDate = new Date().getTime();
  }

  return newStreak;
}

/**
 * Get achievement milestones
 */
export function getAchievementMilestones(stats: UserStats) {
  return {
    nextBadge: getNextBadge(stats),
    progressToNextLevel: getProgressToNextLevel(stats),
    streakStatus: getStreakStatus(stats.streaks),
  };
}

/**
 * Get next badge to unlock
 */
function getNextBadge(stats: UserStats) {
  const unlockedIds = stats.badges.map((b) => b.id);
  const badges = [
    { id: 'first-word', current: stats.wordsCorrect, target: 1 },
    { id: 'ten-correct', current: stats.wordsCorrect, target: 10 },
    { id: 'ninety-accuracy', current: stats.accuracy, target: 90 },
    { id: 'week-streak', current: stats.streaks.currentStreak, target: 7 },
    { id: 'hundred-words', current: stats.wordsCorrect, target: 100 },
  ];

  const unlockedBadges = badges.filter((b) => unlockedIds.includes(b.id));
  const nextBadge = badges.find((b) => !unlockedIds.includes(b.id));

  return {
    current: unlockedBadges.length,
    total: badges.length,
    nextBadge,
  };
}

/**
 * Get progress to next level
 */
function getProgressToNextLevel(stats: UserStats) {
  const currentLevelPoints = Math.pow(stats.level - 1, 2) * 100;
  const nextLevelPoints = Math.pow(stats.level, 2) * 100;
  const progress = stats.totalPoints - currentLevelPoints;
  const required = nextLevelPoints - currentLevelPoints;

  return {
    current: progress,
    required,
    percentage: Math.round((progress / required) * 100),
  };
}

/**
 * Get streak status
 */
function getStreakStatus(streak: Streak) {
  const today = new Date();
  const lastActive = new Date(streak.lastActiveDate);
  const daysDiff = Math.floor(
    (today.getTime() - lastActive.getTime()) / (24 * 60 * 60 * 1000)
  );

  return {
    current: streak.currentStreak,
    longest: streak.longestStreak,
    atRisk: daysDiff > 1,
    daysSinceActive: daysDiff,
  };
}
