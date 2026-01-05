/**
 * GAMIFICATION INTEGRATION INSTRUCTIONS FOR script.js
 * 
 * This file contains the code snippets to add to your existing script.js
 * to integrate the gamification system. Follow the marked sections below.
 */

// ============================================================================
// SECTION 1: Add to DOMContentLoaded event (around line 75-90)
// ============================================================================
// BEFORE:
// window.addEventListener('DOMContentLoaded', async () => {
//   const savedUser = localStorage.getItem('currentUser');
//   if (savedUser) {
//     currentUser = savedUser;
//     await loadUserLogsFromFirebase();
//     showHome();
//   }
// });

// AFTER:
// window.addEventListener('DOMContentLoaded', async () => {
//   const savedUser = localStorage.getItem('currentUser');
//   if (savedUser) {
//     currentUser = savedUser;
//     await loadUserLogsFromFirebase();
//     // GAMIFICATION: Load user stats
//     if (window.gamification) {
//       await window.gamification.loadGameificationData(currentUser);
//     }
//     showHome();
//   }
// });

// ============================================================================
// SECTION 2: Add event listener for View Badges button (around line 155)
// ============================================================================
// ADD AFTER: trendsBtn.addEventListener('click', showTrends);

// // View Badges/Achievements
// const badgesBtn = document.getElementById('view-badges');
// if (badgesBtn) {
//   badgesBtn.addEventListener('click', () => {
//     home.style.display = 'none';
//     document.getElementById('badges-view').style.display = 'block';
//     if (window.gamification) {
//       window.gamification.updateBadgePage();
//     }
//   });
// }

// // Back from Badges
// const backFromBadgesBtn = document.getElementById('back-from-badges');
// if (backFromBadgesBtn) {
//   backFromBadgesBtn.addEventListener('click', () => {
//     document.getElementById('badges-view').style.display = 'none';
//     home.style.display = 'block';
//   });
// }

// ============================================================================
// SECTION 3: Modify showHome() function (around line 165)
// ============================================================================
// ADD IN showHome() function after showing home screen:

// function showHome() {
//   home.style.display = 'block';
//   test.style.display = 'none';
//   trendsView.style.display = 'none';
//   document.getElementById('badges-view').style.display = 'none';
//   currentUserDisplay.textContent = `Logged in as: ${currentUser}`;
//   // GAMIFICATION: Update UI with user stats
//   if (window.gamification) {
//     window.gamification.updateGameificationUI();
//   }
// }

// ============================================================================
// SECTION 4: Track time per word (around line 350, in showTest())
// ============================================================================
// MODIFY the part where you display a word:

// function showNextWord() {
//   if (currentIndex < currentWords.length) {
//     wordStartTime = Date.now(); // GAMIFICATION: Add this line
//     // ... rest of function ...
//   }
// }

// ============================================================================
// SECTION 5: Calculate points on correct answer (around line 450, in checkAnswer())
// ============================================================================
// MODIFY the success condition:

// function checkAnswer() {
//   const userAnswer = attemptInput.value.trim().toLowerCase();
//   const correct = userAnswer === currentWord.word.toLowerCase();
//   
//   if (correct) {
//     feedback.textContent = '✅ Correct!';
//     feedback.className = 'correct animate-slide-in';
//
//     // GAMIFICATION: Calculate points
//     const timeSpent = (Date.now() - wordStartTime) / 1000;
//     const difficulty = currentWord.grade || 1; // 1-5 scale
//     const points = window.gamification ? 
//       window.gamification.calculatePointsForAnswer(true, difficulty, timeSpent) : 0;
//
//     if (window.gamification) {
//       window.gamification.userStats.totalPoints += points;
//       window.gamification.updateStreak(true);
//       // Show points earned (optional toast notification)
//       console.log(`+${points} points!`);
//     }
//
//     // ... rest of success logic ...
//   } else {
//     // GAMIFICATION: Update streak on wrong answer
//     if (window.gamification) {
//       window.gamification.updateStreak(false);
//     }
//     // ... rest of failure logic ...
//   }
// }

// ============================================================================
// SECTION 6: Process session end (around line 500, in endSession())
// ============================================================================
// ADD after collecting session statistics:

// function endSession() {
//   // ... collect session stats ...
//   const correct = sessionData.correct;
//   const total = sessionData.total;
//   const sessionPoints = sessionData.totalPoints || 0;
//   
//   // GAMIFICATION: Process session end
//   if (window.gamification) {
//     const levelBefore = window.gamification.userStats.level;
//     const results = window.gamification.processSessionEnd({
//       correct: correct,
//       total: total,
//       totalTime: sessionData.totalTime || 0,
//       pointsEarned: sessionPoints,
//       levelBefore: levelBefore
//     });
//
//     // Trigger confetti on level up
//     if (results.levelUp) {
//       window.gamification.triggerConfetti();
//       // Optional: Show level up message
//       console.log(`🎉 Level up! You're now level ${window.gamification.userStats.level}`);
//     }
//
//     // Show new badges earned
//     results.newBadges.forEach(badge => {
//       console.log(`🏆 New Badge: ${badge.name}`);
//     });
//
//     // Save to Firebase
//     await window.gamification.saveGameificationData(currentUser);
//     window.gamification.updateGameificationUI();
//   }
//
//   // ... show results screen ...
// }

// ============================================================================
// SECTION 7: Update Analytics Display (around line 600, in showTrends())
// ============================================================================
// ADD after loading analytics:

// async function showTrends() {
//   // ... existing code ...
//   
//   // GAMIFICATION: Load and display leaderboard
//   if (window.gamification && firebaseReady) {
//     try {
//       // Fetch all users' gamification data
//       const snapshot = await database.ref('users').once('value');
//       const allUsers = [];
//       snapshot.forEach(childSnapshot => {
//         const userData = childSnapshot.val();
//         if (userData.gamification) {
//           allUsers.push({
//             name: userData.gamification.username || 'Unknown',
//             points: userData.gamification.totalPoints || 0,
//             level: userData.gamification.level || 1
//           });
//         }
//       });
//       window.gamification.renderLeaderboard(allUsers);
//     } catch (error) {
//       console.error('Error loading leaderboard:', error);
//     }
//   }
// }

// ============================================================================
// SECTION 8: Update logout (around line 750, in logoutUser())
// ============================================================================
// MODIFY logoutUser():

// function logoutUser() {
//   // GAMIFICATION: Save stats before logout
//   if (window.gamification && currentUser) {
//     window.gamification.saveGameificationData(currentUser);
//   }
//   
//   currentUser = null;
//   localStorage.removeItem('currentUser');
//   logs = [];
//   currentWords = [];
//   currentIndex = 0;
//   
//   showLoginScreen();
// }

// ============================================================================
// SECTION 9: HTML Updates Required (in index.html)
// ============================================================================
// 
// 1. Add Font Awesome for icons:
//    In <head>, add:
//    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
//
// 2. Add new containers in the appropriate sections:
//
//    A) In home screen, add stats bar:
//    <div class="stats-bar">
//      <div><div id="user-level">1</div><div>Level</div></div>
//      <div><div id="user-points">0</div><div>Points</div></div>
//      <div><span id="user-streak">0</span> Streak</div>
//    </div>
//
//    B) Add "View Badges" button:
//    <button id="view-badges">🏆 Badges & Achievements</button>
//
//    C) Add Badges view screen (before trends-view):
//    <div id="badges-view" style="display: none;">
//      <!-- See index-enhanced.html for full structure -->
//    </div>
//
// ============================================================================
// SECTION 10: CSS Updates (in styles.css or new stylesheet)
// ============================================================================
// 
// Add the bee-themed CSS from styles-bee-theme.css
// OR manually add these key classes:
//
// .stats-bar { grid layout for level/points/streak }
// .kpi-card { yellow gradient card style }
// .badge { unlocked/locked state styles }
// .streak-badge { fire emoji with animation }
// .progress-container { progress bar styling }
// .leaderboard { leaderboard table styling }
//
// See styles-bee-theme.css for complete styling.

// ============================================================================
// SECTION 11: Initialize gamification on page load
// ============================================================================
// ADD at the very end of script.js:

// // Initialize gamification system if script is loaded
// window.addEventListener('load', () => {
//   if (window.gamification) {
//     console.log('✅ Gamification system initialized');
//     console.log('Badges available:', Object.keys(window.gamification.BADGES).length);
//   } else {
//     console.warn('⚠️ Gamification script not loaded');
//   }
// });

// ============================================================================
// DETAILED INTEGRATION CHECKLIST
// ============================================================================
/*
✅ Step 1: Add gamification-integration.js to HTML
  - Add <script src="gamification-integration.js"></script> before </head>

✅ Step 2: Add Font Awesome
  - Add <link rel="stylesheet" href="...font-awesome.css"> in <head>

✅ Step 3: Update script.js with integration code
  - DOMContentLoaded: load gamification data
  - showHome(): update gamification UI
  - showTest(): track word start time
  - checkAnswer(): calculate points, update streak
  - endSession(): process session, save data, trigger confetti
  - showTrends(): load and display leaderboard
  - logoutUser(): save gamification data

✅ Step 4: Add HTML elements
  - Stats bar in home screen
  - Badges view screen
  - Leaderboard in analytics
  - Confetti container

✅ Step 5: Update CSS
  - Apply bee-theme colors
  - Style badges, streaks, progress bars
  - Responsive design for mobile

✅ Step 6: Test thoroughly
  - Badge unlocks
  - Point calculation
  - Level progression
  - Streak tracking
  - Firebase persistence

✅ Step 7: Deploy
  - Commit changes
  - Test on multiple devices
  - Monitor Firebase usage
  - Track user engagement metrics
*/

// ============================================================================
// EXAMPLE: Complete checkAnswer() with gamification
// ============================================================================
/*
function checkAnswer() {
  const userAnswer = attemptInput.value.trim().toLowerCase();
  const correct = userAnswer === currentWord.word.toLowerCase();
  
  // Track time
  const timeSpent = (Date.now() - wordStartTime) / 1000;
  
  if (correct) {
    feedback.textContent = '✅ Correct!';
    feedback.className = 'correct animate-slide-in';
    
    // Gamification
    const difficulty = currentWord.grade || 3;
    const points = window.gamification?.calculatePointsForAnswer(true, difficulty, timeSpent) || 0;
    window.gamification?.updateStreak(true);
    if (window.gamification) {
      window.gamification.userStats.totalPoints += points;
    }
    
    // Log to Firebase
    logs.push({
      word: currentWord.word,
      userAnswer: userAnswer,
      correct: true,
      timestamp: Date.now(),
      timeSpent: timeSpent,
      pointsEarned: points,
      grade: currentWord.grade
    });
    
    // Save to Firebase in real-time
    if (firebaseReady && currentUser) {
      database.ref(`users/${currentUser}/logs/${sessionId}/${currentIndex}`).set({
        word: currentWord.word,
        correct: true,
        timeSpent: timeSpent,
        pointsEarned: points,
        timestamp: Date.now()
      });
    }
    
    attemptInput.disabled = true;
    submitBtn.style.display = 'none';
    nextBtn.style.display = 'block';
    nextBtn.focus();
    
  } else {
    feedback.textContent = '❌ Incorrect. The correct spelling is: ' + currentWord.word;
    feedback.className = 'incorrect animate-slide-in';
    
    // Gamification
    window.gamification?.updateStreak(false);
    
    // Log to Firebase
    logs.push({
      word: currentWord.word,
      userAnswer: userAnswer,
      correct: false,
      timestamp: Date.now(),
      timeSpent: timeSpent,
      pointsEarned: 0,
      grade: currentWord.grade
    });
    
    if (firebaseReady && currentUser) {
      database.ref(`users/${currentUser}/logs/${sessionId}/${currentIndex}`).set({
        word: currentWord.word,
        correct: false,
        timeSpent: timeSpent,
        pointsEarned: 0,
        timestamp: Date.now()
      });
    }
    
    attemptInput.disabled = true;
    submitBtn.style.display = 'none';
    nextBtn.style.display = 'block';
    nextBtn.focus();
  }
}
*/
