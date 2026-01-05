/**
 * GAMIFICATION INTEGRATION FOR WEB APP
 * Handles badges, streaks, points, and leaderboards
 */

// ========== BADGE DEFINITIONS ==========
const BADGES = {
  first_buzz: {
    id: 'first_buzz',
    name: 'First Buzz',
    icon: '🐝',
    description: 'Complete your first spelling test',
    condition: (stats) => stats.totalAnswered >= 1
  },
  rising_star: {
    id: 'rising_star',
    name: 'Rising Star',
    icon: '⭐',
    description: 'Reach 80% accuracy in a session',
    condition: (stats, sessionAccuracy) => sessionAccuracy >= 80
  },
  perfect_hive: {
    id: 'perfect_hive',
    name: 'Perfect Hive',
    icon: '🎯',
    description: 'Get 10 words correct in a row',
    condition: (stats) => stats.currentStreak >= 10
  },
  honey_hunter: {
    id: 'honey_hunter',
    name: 'Honey Hunter',
    icon: '🍯',
    description: 'Master 50 words with 100% accuracy',
    condition: (stats) => stats.masteredWords >= 50
  },
  speedster_bee: {
    id: 'speedster_bee',
    name: 'Speedster Bee',
    icon: '⚡',
    description: 'Average less than 3 seconds per word',
    condition: (stats) => stats.averageTimePerWord < 3
  },
  practice_champion: {
    id: 'practice_champion',
    name: 'Practice Champion',
    icon: '🏆',
    description: 'Complete 20 practice sessions',
    condition: (stats) => stats.totalSessions >= 20
  },
  word_master: {
    id: 'word_master',
    name: 'Word Master',
    icon: '📚',
    description: 'Reach level 10',
    condition: (stats) => stats.level >= 10
  },
  unstoppable: {
    id: 'unstoppable',
    name: 'Unstoppable',
    icon: '🔥',
    description: 'Build a 30-day streak',
    condition: (stats) => stats.dailyStreak >= 30
  }
};

// ========== GAMIFICATION STATE ==========
let userStats = {
  level: 1,
  totalPoints: 0,
  totalAnswered: 0,
  correctAnswers: 0,
  masteredWords: [],
  badgesEarned: [],
  dailyStreak: 0,
  weeklyStreak: 0,
  monthlyStreak: 0,
  currentStreak: 0,
  averageTimePerWord: 0,
  totalSessions: 0,
  lastActivityDate: new Date().toISOString().split('T')[0],
  allTimeAccuracy: 0
};

// ========== POINT CALCULATION ==========
function calculatePointsForAnswer(isCorrect, difficulty, timeSpent) {
  if (!isCorrect) return 0;

  let basePoints = 10;
  
  // Difficulty bonus (1-5 scale)
  const difficultyBonus = difficulty * 5;
  
  // Speed bonus (max 10 points if answered in < 3 seconds)
  let speedBonus = 0;
  if (timeSpent <= 3) speedBonus = 10;
  else if (timeSpent <= 5) speedBonus = 8;
  else if (timeSpent <= 10) speedBonus = 5;
  
  // Streak bonus (1 point per streak count, capped at 20)
  const streakBonus = Math.min(userStats.currentStreak, 20);
  
  return basePoints + difficultyBonus + speedBonus + streakBonus;
}

// ========== LEVEL CALCULATION ==========
function calculateLevel() {
  // Level progression: 1000 points per level
  return Math.floor(userStats.totalPoints / 1000) + 1;
}

// ========== BADGE CHECKING & AWARDING ==========
function checkAndAwardBadges(sessionData) {
  const sessionAccuracy = sessionData.correct / sessionData.total * 100;
  const newBadges = [];

  Object.values(BADGES).forEach(badge => {
    if (!userStats.badgesEarned.includes(badge.id)) {
      let isBadgeEarned = false;

      if (badge.id === 'rising_star') {
        isBadgeEarned = badge.condition(userStats, sessionAccuracy);
      } else {
        isBadgeEarned = badge.condition(userStats);
      }

      if (isBadgeEarned) {
        userStats.badgesEarned.push(badge.id);
        newBadges.push(badge);
        
        // Award bonus points for badge
        userStats.totalPoints += 50;
        
        // Show celebration
        showBadgeUnlock(badge);
      }
    }
  });

  return newBadges;
}

// ========== STREAK MANAGEMENT ==========
function updateStreak(wasCorrect) {
  if (wasCorrect) {
    userStats.currentStreak += 1;
  } else {
    userStats.currentStreak = 0;
  }

  // Update daily streak
  const today = new Date().toISOString().split('T')[0];
  if (today === userStats.lastActivityDate && wasCorrect) {
    // Continuing or extending streak
    if (userStats.dailyStreak === 0) {
      userStats.dailyStreak = 1;
    } else {
      // Already counted for today
    }
  } else if (today !== userStats.lastActivityDate && wasCorrect) {
    // New day
    if (userStats.lastActivityDate === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
      // Yesterday was the last activity - extend streak
      userStats.dailyStreak += 1;
    } else {
      // Gap in streak - reset
      userStats.dailyStreak = 1;
    }
    userStats.lastActivityDate = today;
  }
}

// ========== SESSION DATA PROCESSING ==========
function processSessionEnd(sessionData) {
  const sessionAccuracy = (sessionData.correct / sessionData.total * 100).toFixed(2);
  
  // Update stats
  userStats.totalAnswered += sessionData.total;
  userStats.correctAnswers += sessionData.correct;
  userStats.totalSessions += 1;
  userStats.allTimeAccuracy = (userStats.correctAnswers / userStats.totalAnswered * 100).toFixed(2);
  
  // Calculate average time per word
  const totalTime = sessionData.totalTime || 0;
  const avgTime = totalTime > 0 ? (totalTime / sessionData.total).toFixed(2) : 0;
  
  if (userStats.averageTimePerWord === 0) {
    userStats.averageTimePerWord = avgTime;
  } else {
    // Running average
    userStats.averageTimePerWord = (
      (userStats.averageTimePerWord * (userStats.totalSessions - 1) + avgTime) / 
      userStats.totalSessions
    ).toFixed(2);
  }

  // Update level
  userStats.level = calculateLevel();

  // Check for badge unlocks
  const newBadges = checkAndAwardBadges(sessionData);

  return {
    accuracy: sessionAccuracy,
    newBadges: newBadges,
    pointsEarned: sessionData.pointsEarned || 0,
    levelUp: sessionData.levelBefore !== userStats.level
  };
}

// ========== DISPLAY FUNCTIONS ==========
function showBadgeUnlock(badge) {
  // Create badge unlock animation
  const celebration = document.createElement('div');
  celebration.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #FFD700 0%, #FFC700 100%);
    padding: 40px;
    border-radius: 20px;
    border: 4px solid #000;
    z-index: 10000;
    text-align: center;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    animation: badge-popup 0.6s ease;
  `;

  celebration.innerHTML = `
    <div style="font-size: 80px; margin-bottom: 16px;">${badge.icon}</div>
    <h2 style="color: #000; font-size: 28px; margin: 0 0 8px 0;">New Badge!</h2>
    <p style="color: #000; font-size: 20px; font-weight: 700; margin: 0 0 4px 0;">${badge.name}</p>
    <p style="color: #333; font-size: 14px; margin: 0;">${badge.description}</p>
  `;

  document.body.appendChild(celebration);

  // Play celebration sound if available
  playAchievementSound();

  // Remove after animation
  setTimeout(() => {
    celebration.remove();
  }, 3000);
}

function playAchievementSound() {
  // Use Web Audio API to create a simple beep
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;

    // Chord: E, G, B (celebratory)
    [330, 392, 494].forEach((freq, i) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      
      osc.start(now);
      osc.stop(now + 0.5);
    });
  } catch (e) {
    console.log('Audio context not available');
  }
}

// ========== UI UPDATE FUNCTIONS ==========
function updateGameificationUI() {
  const levelDisplay = document.getElementById('user-level');
  const pointsDisplay = document.getElementById('user-points');
  const streakDisplay = document.getElementById('user-streak');

  if (levelDisplay && !isNaN(userStats.level)) {
    levelDisplay.textContent = userStats.level;
  }
  if (pointsDisplay && !isNaN(userStats.totalPoints)) {
    pointsDisplay.textContent = userStats.totalPoints.toLocaleString();
  }
  if (streakDisplay && !isNaN(userStats.dailyStreak)) {
    streakDisplay.textContent = userStats.dailyStreak;
  }
}

function renderBadges() {
  const container = document.getElementById('badges-container');
  if (!container) return;

  container.innerHTML = '';

  Object.values(BADGES).forEach(badge => {
    const isUnlocked = userStats.badgesEarned.includes(badge.id);
    
    const badgeEl = document.createElement('div');
    badgeEl.className = `badge ${isUnlocked ? 'unlocked' : 'locked'}`;
    badgeEl.innerHTML = `
      <div class="badge-icon">${badge.icon}</div>
      <div class="badge-name">${badge.name}</div>
    `;
    badgeEl.title = badge.description;
    badgeEl.setAttribute('aria-label', `${badge.name}: ${badge.description}`);
    
    container.appendChild(badgeEl);
  });
}

function renderLeaderboard(allUsers = []) {
  const container = document.getElementById('leaderboard-container');
  if (!container) return;

  container.innerHTML = '';

  // Sort by points
  const sortedUsers = [...allUsers, { 
    name: currentUser, 
    points: userStats.totalPoints, 
    level: userStats.level 
  }].sort((a, b) => (b.points || 0) - (a.points || 0));

  sortedUsers.slice(0, 10).forEach((user, idx) => {
    const entry = document.createElement('div');
    entry.className = 'leaderboard-entry';
    
    let rankIcon = idx + 1;
    if (idx === 0) rankIcon = '🥇';
    else if (idx === 1) rankIcon = '🥈';
    else if (idx === 2) rankIcon = '🥉';

    entry.innerHTML = `
      <div class="rank">${rankIcon}</div>
      <div class="username">${user.name}</div>
      <div class="level">L${user.level}</div>
      <div class="points">${(user.points || 0).toLocaleString()}pts</div>
    `;

    container.appendChild(entry);
  });
}

function updateBadgePage() {
  const levelDisplay = document.getElementById('badge-level');
  const pointsDisplay = document.getElementById('badge-points');
  const pointsNextDisplay = document.getElementById('badge-points-next');
  const streakDisplay = document.getElementById('badge-streak');
  const badgeCountDisplay = document.getElementById('badge-count');

  if (levelDisplay) {
    levelDisplay.innerHTML = `<i class="fas fa-star"></i> ${userStats.level}`;
  }
  if (pointsDisplay) {
    pointsDisplay.textContent = userStats.totalPoints.toLocaleString();
  }
  if (pointsNextDisplay) {
    const nextLevelPoints = userStats.level * 1000;
    pointsNextDisplay.textContent = nextLevelPoints.toLocaleString();
  }
  if (streakDisplay) {
    streakDisplay.textContent = userStats.dailyStreak;
  }
  if (badgeCountDisplay) {
    badgeCountDisplay.textContent = userStats.badgesEarned.length;
  }

  // Update progress bar
  const currentLevelPoints = (userStats.level - 1) * 1000;
  const nextLevelPoints = userStats.level * 1000;
  const progressPercent = ((userStats.totalPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints) * 100);
  
  const progressBar = document.getElementById('level-progress-bar');
  if (progressBar) {
    progressBar.style.width = Math.min(progressPercent, 100) + '%';
  }

  renderBadges();
}

// ========== FIREBASE PERSISTENCE ==========
async function saveGameificationData(userId) {
  if (!window.firebaseReady || !userId || !window.database) return;

  try {
    await window.database.ref(`users/${userId}/gamification`).set({
      level: userStats.level,
      totalPoints: userStats.totalPoints,
      badgesEarned: userStats.badgesEarned,
      dailyStreak: userStats.dailyStreak,
      correctAnswers: userStats.correctAnswers,
      totalAnswered: userStats.totalAnswered,
      averageTimePerWord: userStats.averageTimePerWord,
      totalSessions: userStats.totalSessions,
      lastActivityDate: userStats.lastActivityDate,
      allTimeAccuracy: userStats.allTimeAccuracy,
      currentStreak: userStats.currentStreak,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving gamification data:', error);
  }
}

async function loadGameificationData(userId) {
  if (!window.firebaseReady || !userId || !window.database) return;

  try {
    const snapshot = await window.database.ref(`users/${userId}/gamification`).once('value');
    if (snapshot.exists()) {
      const data = snapshot.val();
      Object.assign(userStats, data);
      return true;
    }
  } catch (error) {
    console.error('Error loading gamification data:', error);
  }
  return false;
}

// ========== CONFETTI ANIMATION ==========
function triggerConfetti() {
  const container = document.getElementById('confetti-container');
  if (!container) return;

  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
      position: absolute;
      left: ${Math.random() * 100}%;
      top: -10px;
      width: 10px;
      height: 10px;
      background: ${['#FFD700', '#FF9800', '#4CAF50', '#2196F3'][Math.floor(Math.random() * 4)]};
      border-radius: 50%;
      opacity: 1;
      animation: confetti-fall ${2 + Math.random() * 1}s linear;
      pointer-events: none;
    `;

    container.appendChild(confetti);

    setTimeout(() => confetti.remove(), 3000);
  }
}

// Export functions for use in main script
window.gamification = {
  calculatePointsForAnswer,
  calculateLevel,
  checkAndAwardBadges,
  updateStreak,
  processSessionEnd,
  showBadgeUnlock,
  updateGameificationUI,
  renderBadges,
  renderLeaderboard,
  updateBadgePage,
  saveGameificationData,
  loadGameificationData,
  triggerConfetti,
  userStats,
  BADGES
};
