// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyASUhtq71S0vV0ckaQQMniW7AgQM0H08eA",
  authDomain: "spelling-bee-app-c1e76.firebaseapp.com",
  projectId: "spelling-bee-app-c1e76",
  storageBucket: "spelling-bee-app-c1e76.firebasestorage.app",
  messagingSenderId: "255014034100",
  appId: "1:255014034100:web:ceb73dae25669a610f55e1",
  measurementId: "G-L6E8HLFQ46"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
window.database = database; // Make available to gamification

// Wait for Firebase to be ready
let firebaseReady = false;
window.firebaseReady = firebaseReady; // Make available to gamification
database.ref('.info/connected').on('value', (snap) => {
  if (snap.val() === true) {
    firebaseReady = true;
    window.firebaseReady = true;
    console.log('Firebase connected');
  } else {
    firebaseReady = false;
    window.firebaseReady = false;
    console.log('Firebase disconnected');
  }
});

// Load elements
const loginScreen = document.getElementById('login-screen');
const usernameInput = document.getElementById('username-input');
const loginBtn = document.getElementById('login-btn');
const currentUserDisplay = document.getElementById('current-user');
const logoutBtn = document.getElementById('logout-btn');
const home = document.getElementById('home');
const test = document.getElementById('test');
const trendsView = document.getElementById('trends-view');
const gradeSelect = document.getElementById('grade');
const startBtn = document.getElementById('start');
const trendsBtn = document.getElementById('trends');
const wordPrompt = document.getElementById('word-prompt');
const listenBtn = document.getElementById('listen');
const meaningBtn = document.getElementById('meaning-btn');
const meaningDisplay = document.getElementById('meaning-display');
const attemptInput = document.getElementById('attempt');
const submitBtn = document.getElementById('submit');
const nextBtn = document.getElementById('next');
const endBtn = document.getElementById('end');
const feedback = document.getElementById('feedback');
const accuracyP = document.getElementById('accuracy');
const backHomeBtn = document.getElementById('back-home');
const voiceSelect = document.getElementById('voice');
// Note: accuracyChart context obtained when showTrends() is called

// Data variables
let words = [];
let filteredWords = [];
let currentUser = null;
let logs = [];
let currentWords = [];
let currentIndex = 0;
let currentWord = '';
let sessionId = Date.now();
let wordStartTime = 0; // Track time for each word
let sessionStartTime = Date.now(); // Track session start time
let testMode = 'practice'; // 'practice' or 'test' - determines whether to cover all words

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', async () => {
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    currentUser = savedUser;
    await loadUserLogsFromFirebase();
    // GAMIFICATION: Load user stats
    if (window.gamification) {
      await window.gamification.loadGameificationData(currentUser);
    }
    showHome();
  }
});

// Load words from JSON
fetch('data/words.json')
  .then(res => res.json())
  .then(data => {
    words = data;
    populateGradeDropdown();
  })
  .catch(err => console.error('Error loading words:', err));

// Populate voices when page loads and when voices are ready
window.addEventListener('load', () => {
  populateVoices();
});
speechSynthesis.onvoiceschanged = populateVoices;

// Populate voice selector dropdown
function populateVoices() {
  const voices = speechSynthesis.getVoices();
  const usVoices = voices.filter(v => v.lang && (v.lang === 'en-US' || v.lang.startsWith('en-US')));
  
  console.log('Available US English voices:', usVoices.map(v => ({ name: v.name, lang: v.lang })));
  
  // Clear existing options (except first)
  while (voiceSelect.options.length > 1) {
    voiceSelect.remove(1);
  }
  
  // Add voice options
  usVoices.forEach((voice, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = voice.name;
    voiceSelect.appendChild(option);
  });
}

// Load user logs from Firebase
async function loadUserLogsFromFirebase() {
  if (!currentUser) {
    console.log('No user logged in');
    return;
  }
  
  try {
    const userRef = database.ref(`users/${currentUser}/logs`);
    
    // Load data once with promise
    const snapshot = await userRef.once('value');
    const data = snapshot.val();
    logs = data ? Object.values(data) : [];
    console.log(`✓ Loaded ${logs.length} logs for ${currentUser}`);
    
    // Also set up real-time listener for future updates
    userRef.off('value'); // Remove old listener if exists
    userRef.on('value', (snap) => {
      const newData = snap.val();
      logs = newData ? Object.values(newData) : [];
      console.log(`✓ Updated: ${logs.length} logs for ${currentUser}`);
    });
  } catch (error) {
    console.error('Error loading Firebase logs:', error);
    logs = [];
  }
}

// Save user logs to Firebase
function saveUserLogsToFirebase(logEntry) {
  if (!currentUser) {
    console.error('No user logged in');
    return;
  }
  
  const userRef = database.ref(`users/${currentUser}/logs`);
  const newLogRef = userRef.push();
  newLogRef.set(logEntry, (error) => {
    if (error) {
      console.error('Error saving to Firebase:', error);
    } else {
      console.log('Log saved to Firebase');
    }
  });
}

// Login handler
loginBtn.addEventListener('click', async () => {
  try {
    console.log('=== LOGIN HANDLER STARTED ===');
    console.log('Login button clicked');
    
    // Check if securityContext exists
    console.log('securityContext available:', !!window.securityContext);
    console.log('securityContext.validateUsername available:', typeof window.securityContext?.validateUsername);
    
    const rawUsername = usernameInput.value.trim();
    console.log('Username entered:', rawUsername);
    
    if (!rawUsername) {
      alert('Please enter a username');
      return;
    }
    
    // SECURITY: Validate username format and content
    const usernameValidation = window.securityContext?.validateUsername ? 
      window.securityContext.validateUsername(rawUsername) : 
      { valid: !!rawUsername, sanitized: rawUsername };
    
    console.log('Username validation result:', usernameValidation);
    
    if (!usernameValidation.valid) {
      alert(usernameValidation.error || 'Please enter a valid username');
      return;
    }
    
    currentUser = usernameValidation.sanitized;
    console.log('Current user set to:', currentUser);
    localStorage.setItem('currentUser', currentUser);
    console.log('User saved to localStorage');
    
    // CSRF: Create token on login for session protection
    if (window.csrfProtection) {
      const csrfToken = window.csrfProtection.createToken(currentUser);
      console.log('CSRF token created:', !!csrfToken);
    } else {
      console.warn('csrfProtection not available');
    }
    
    // Load Firebase logs with timeout
    console.log('About to load Firebase logs...');
    try {
      // Use Promise.race with timeout to prevent hanging
      const loadPromise = loadUserLogsFromFirebase();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firebase load timeout')), 5000)
      );
      
      await Promise.race([loadPromise, timeoutPromise]);
      console.log('Firebase logs loaded successfully');
    } catch (firebaseError) {
      console.warn('Firebase load failed or timed out, proceeding anyway:', firebaseError.message);
      logs = [];
    }
    
    console.log('Showing home screen...');
    showHome();
    console.log('=== LOGIN SUCCESSFUL - HOME SCREEN SHOWN ===');
  } catch (error) {
    console.error('=== LOGIN ERROR ===', error);
    alert('Login error: ' + (error.message || error.toString()));
  }
});

// Allow Enter key to login
usernameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    loginBtn.click();
  }
});

// Logout handler
logoutBtn.addEventListener('click', async () => {
  if (confirm('Are you sure you want to logout?')) {
    // GAMIFICATION: Save stats before logout
    if (window.gamification && currentUser) {
      await window.gamification.saveGameificationData(currentUser);
    }
    
    // CSRF: Clear token on logout
    if (window.csrfProtection) {
      window.csrfProtection.clearToken();
    }
    
    currentUser = null;
    localStorage.removeItem('currentUser');
    logs = [];
    loginScreen.style.display = 'flex';
    home.style.display = 'none';
    test.style.display = 'none';
    trendsView.style.display = 'none';
    document.getElementById('badges-view').style.display = 'none';
    usernameInput.value = '';
  }
});

// Logout button from analytics page
const logoutBtnAnalytics = document.getElementById('logout-btn-analytics');
if (logoutBtnAnalytics) {
  logoutBtnAnalytics.addEventListener('click', async () => {
    if (confirm('Are you sure you want to logout?')) {
      // GAMIFICATION: Save stats before logout
      if (window.gamification && currentUser) {
        await window.gamification.saveGameificationData(currentUser);
      }
      
      // CSRF: Clear token on logout
      if (window.csrfProtection) {
        window.csrfProtection.clearToken();
      }
      
      currentUser = null;
      localStorage.removeItem('currentUser');
      logs = [];
      loginScreen.style.display = 'flex';
      home.style.display = 'none';
      test.style.display = 'none';
      trendsView.style.display = 'none';
      document.getElementById('badges-view').style.display = 'none';
      usernameInput.value = '';
    }
  });
}
function showHome() {
  loginScreen.style.display = 'none';
  home.style.display = 'block';
  currentUserDisplay.textContent = `👤 Logged in as: ${currentUser}`;
  // GAMIFICATION: Update UI with user stats
  if (window.gamification) {
    window.gamification.updateGameificationUI();
  }
}

// Populate grade dropdown from unique grades in words.json
function populateGradeDropdown() {
  const uniqueGrades = [...new Set(words.map(w => w.grade))].sort();
  
  // Keep "All Grades" option
  gradeSelect.innerHTML = '<option value="all">All Grades</option>';
  
  // Add each unique grade as an option
  uniqueGrades.forEach(grade => {
    const option = document.createElement('option');
    option.value = grade;
    option.textContent = grade;
    gradeSelect.appendChild(option);
  });
  
  console.log('Grade options populated:', uniqueGrades);
}

// Function to get prioritized words (wrongs first, then random)
function getPrioritizedWords(grade) {
  // Filter words by grade
  filteredWords = words.filter(w => grade === 'all' || w.grade === grade);
  
  const now = Date.now();
  const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
  
  // Calculate a priority score for each word
  const wordScores = filteredWords.map(word => {
    const wordLogs = logs.filter(l => l.word === word.word);
    const wrongLogs = wordLogs.filter(l => !l.correct);
    const correctLogs = wordLogs.filter(l => l.correct);
    
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
      mistakeRecency = Math.max(0, 30 - (daysSinceMistake * 2)); // Recent mistakes worth more
    }
    
    // Calculate success streak (words with recent correct answers get lower priority)
    let successStreakPenalty = 0;
    if (correctLogs.length > 0) {
      const lastCorrect = correctLogs[correctLogs.length - 1].timestamp;
      const lastWrong = wrongLogs.length > 0 ? wrongLogs[wrongLogs.length - 1].timestamp : 0;
      
      // If last attempt was correct and recent, lower the priority
      if (lastCorrect > lastWrong) {
        const daysSinceCorrect = (now - lastCorrect) / (24 * 60 * 60 * 1000);
        if (daysSinceCorrect < 7) {
          successStreakPenalty = 20; // Reduce score if recently correct
        }
      }
    }
    
    // Calculate coverage bonus (words asked less frequently get higher priority)
    const coverageBonus = Math.max(0, 20 - (wordLogs.length * 2));
    
    // Final score calculation
    const totalScore = mistakeFrequency + mistakeRecency + coverageBonus - successStreakPenalty;
    
    return { 
      word, 
      score: Math.max(0, totalScore),
      wrongCount: wrongLogs.length,
      timesAsked: wordLogs.length
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
  
  console.log('Top 10 prioritized words:', wordScores.slice(0, 10).map(w => 
    `${w.word.word}(score:${w.score.toFixed(1)},wrong:${w.wrongCount},asked:${w.timesAsked})`
  ).join(', '));
  
  return wordScores.map(ws => ws.word);
}

// Helper function to shuffle an array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Fetch word meaning from Free Dictionary API and speak it
async function fetchAndShowMeaning(word) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
    
    if (!response.ok) {
      alert('No definition found for this word.');
      return;
    }
    
    const data = await response.json();
    
    // SECURITY: Validate API response structure
    const validation = window.securityContext?.validateDictionaryAPIResponse ? 
      window.securityContext.validateDictionaryAPIResponse(data) : 
      { valid: !!data && Array.isArray(data) };
    
    if (!validation?.valid) {
      console.warn('Invalid API response:', validation?.error);
      alert('Invalid definition format received.');
      return;
    }
    
    const entry = data[0];
    
    if (!entry.meanings || entry.meanings.length === 0) {
      alert('No definitions available.');
      return;
    }
    
    // Get the first meaning
    const meaning = entry.meanings[0];
    const definition = meaning.definitions[0]?.definition || 'No definition available';
    const example = meaning.definitions[0]?.example || '';
    const partOfSpeech = meaning.partOfSpeech || '';
    
    // Helper function to mask the word in text
    function maskWord(text, word) {
      if (!text || !word) return text;
      // Create a regex that matches the word (case-insensitive, whole word only)
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      // Replace with blanks (underscores)
      return text.replace(regex, '___');
    }
    
    // Mask the word in definition and example for display
    const displayDefinition = maskWord(definition, word);
    const displayExample = maskWord(example, word);
    
    // Show the definition on screen with HTML escaping
    meaningDisplay.style.display = 'block';
    let html = '';
    
    if (partOfSpeech) {
      // SECURITY: Escape HTML to prevent XSS
      const escapedPoS = window.securityContext?.escapeForDisplay(partOfSpeech) || partOfSpeech;
      html += `<div style="font-size: 0.9rem; color: #764ba2; font-weight: 500; margin-bottom: 0.5rem;">${escapedPoS}</div>`;
    }
    
    // SECURITY: Escape definition and example
    const escapedDef = window.securityContext?.escapeForDisplay(displayDefinition) || displayDefinition;
    const escapedEx = window.securityContext?.escapeForDisplay(displayExample) || displayExample;
    
    html += `<div style="margin-bottom: 0.75rem;"><strong>Definition:</strong> ${escapedDef}</div>`;
    
    if (escapedEx) {
      html += `<div style="font-size: 0.9rem; color: #555; font-style: italic;"><strong>Example:</strong> "${escapedEx}"</div>`;
    }
    
    meaningDisplay.innerHTML = html;
    
    // Automatically speak the definition (use original unmasked version)
    speakWord(definition);
    
  } catch (error) {
    console.error('Error fetching definition:', error);
    // SECURITY: Sanitize error message before showing to user
    const sanitizedError = window.securityContext?.sanitizeError ? 
      window.securityContext.sanitizeError(error) :
      'Unable to fetch definition. Check your internet connection.';
    alert(sanitizedError);
  }
}

// Web Speech API - Use browser's native voices (completely free)
// Version: 2.0 - Web Speech API (no external APIs)
let voices = [];
let selectedVoice = null;

// Load available voices
if ('speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = () => {
    voices = speechSynthesis.getVoices();
    
    // Select the best natural-sounding voice available
    const voicePreferences = [
      'Samantha',      // macOS - natural female voice
      'Victoria',      // macOS - alternative natural voice
      'Google UK English Female', // Chrome - natural
      'Google US English Female', // Chrome fallback
      'Microsoft Zira', // Windows alternative
    ];
    
    selectedVoice = voices.find(v => 
      voicePreferences.some(pref => v.name.includes(pref))
    );
    
    // If no preferred voice found, use first English voice
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('en-'));
    }
    
    // If still no voice, use first available
    if (!selectedVoice && voices.length > 0) {
      selectedVoice = voices[0];
    }
    
    if (selectedVoice) {
      console.log('Selected voice:', selectedVoice.name, '(' + selectedVoice.lang + ')');
    }
  };
  
  // Trigger voices to load
  speechSynthesis.getVoices();
}

function speakWord(word) {
  // Use Web Speech API for natural US English voice synthesis
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.rate = 0.9; // Slightly slower for clarity
  utterance.pitch = 1;
  utterance.volume = 1;

  const voices = speechSynthesis.getVoices();
  let selectedVoice = null;

  // Use user-selected voice if available
  if (voiceSelect.value && voiceSelect.value !== '') {
    const usVoices = voices.filter(v => v.lang && (v.lang === 'en-US' || v.lang.startsWith('en-US')));
    selectedVoice = usVoices[parseInt(voiceSelect.value)];
  }

  // Fallback: auto-select best available voice
  if (!selectedVoice) {
    // Try to find a US English female voice
    selectedVoice = voices.find(v => v.lang && v.lang === 'en-US' && v.name.toLowerCase().includes('female'));
    // Fallback: any US English voice
    if (!selectedVoice) selectedVoice = voices.find(v => v.lang && v.lang === 'en-US');
    // Fallback: any English voice
    if (!selectedVoice) selectedVoice = voices.find(v => v.lang && v.lang.startsWith('en'));
    // Fallback: first available
    if (!selectedVoice) selectedVoice = voices[0];
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
    console.log('Using voice:', selectedVoice.name, selectedVoice.lang);
  }

  speechSynthesis.cancel(); // Cancel any ongoing speech
  speechSynthesis.speak(utterance);
}

// Detect incomplete test session
function getIncompleteTestSession(grade) {
  // Find all test sessions for this user and grade, sorted by timestamp (newest first)
  const testSessions = logs.filter(l => 
    l.user === currentUser && 
    l.testMode === 'test' && 
    (grade === 'all' || l.grade === grade)
  );
  
  if (testSessions.length === 0) return null;
  
  // Group logs by sessionId and check if any session is incomplete
  const sessionMap = {};
  testSessions.forEach(log => {
    if (!sessionMap[log.sessionId]) {
      sessionMap[log.sessionId] = [];
    }
    sessionMap[log.sessionId].push(log);
  });
  
  // Get the most recent session
  const sessionIds = Object.keys(sessionMap).sort((a, b) => b - a);
  if (sessionIds.length === 0) return null;
  
  const latestSessionId = sessionIds[0];
  const latestSession = sessionMap[latestSessionId];
  
  // Get all words for this grade to compare
  const allWordsForGrade = words.filter(w => grade === 'all' || w.grade === grade);
  
  // If the latest session has fewer words than available, it's incomplete
  if (latestSession.length < allWordsForGrade.length) {
    return {
      sessionId: latestSessionId,
      wordsCompleted: latestSession.length,
      totalWords: allWordsForGrade.length,
      currentIndex: latestSession.length // Resume from next word
    };
  }
  
  return null;
}

// Start practice (prioritized words)
startBtn.addEventListener('click', () => {
  testMode = 'practice';
  const grade = gradeSelect.value;
  currentWords = getPrioritizedWords(grade);
  if (currentWords.length === 0) return alert('No words available for this grade.');
  sessionId = Date.now();
  startSession();
});


// Start practice test (all words)
const startTestBtn = document.getElementById('start-test');
if (startTestBtn) {
  startTestBtn.addEventListener('click', () => {
    testMode = 'test';
    const grade = gradeSelect.value;
    
    // Check for incomplete test session
    const incompleteTest = getIncompleteTestSession(grade);
    
    if (incompleteTest) {
      // Show resume modal
      showResumeModal(grade, incompleteTest);
    } else {
      // Start fresh test
      startNewTest(grade);
    }
  });
}

// Start a new test session
function startNewTest(grade) {
  currentWords = words.filter(w => grade === 'all' || w.grade === grade);
  if (currentWords.length === 0) return alert('No words available for this grade.');
  sessionId = Date.now();
  currentIndex = 0;
  startSession();
}

// Resume a previous test session
function resumeTestSession(incompleteTest, grade) {
  const resumeSessionLogs = logs.filter(l => l.sessionId === incompleteTest.sessionId);
  currentWords = words.filter(w => grade === 'all' || w.grade === grade);
  sessionId = incompleteTest.sessionId; // Keep the same session ID
  currentIndex = incompleteTest.currentIndex;
  startSession();
}

// Show resume modal
function showResumeModal(grade, incompleteTest) {
  const modal = document.getElementById('resume-modal');
  const resumeBtn = document.getElementById('resume-btn');
  const restartBtn = document.getElementById('restart-btn');
  const closeBtn = document.getElementById('modal-close-btn');
  const progressDisplay = document.getElementById('resume-progress');
  
  // Update progress display
  progressDisplay.textContent = `${incompleteTest.wordsCompleted}/${incompleteTest.totalWords}`;
  
  // Show modal
  modal.style.display = 'flex';
  
  // Helper function to close modal
  const closeModal = () => {
    modal.style.display = 'none';
  };
  
  // Remove old event listeners to prevent duplicates
  const newResumeBtn = resumeBtn.cloneNode(true);
  const newRestartBtn = restartBtn.cloneNode(true);
  const newCloseBtn = closeBtn.cloneNode(true);
  resumeBtn.parentNode.replaceChild(newResumeBtn, resumeBtn);
  restartBtn.parentNode.replaceChild(newRestartBtn, restartBtn);
  closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
  
  // Add new listeners
  document.getElementById('resume-btn').addEventListener('click', () => {
    closeModal();
    resumeTestSession(incompleteTest, grade);
  });
  
  document.getElementById('restart-btn').addEventListener('click', () => {
    closeModal();
    startNewTest(grade);
  });
  
  // Close button (x icon)
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  
  // Escape key to close modal
  const handleEscapeKey = (event) => {
    if (event.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscapeKey);
    }
  };
  document.addEventListener('keydown', handleEscapeKey);
}



function startSession() {
  home.style.display = 'none';
  test.style.display = 'block';
  nextWord();
}

function nextWord() {
  currentIndex++;
  if (currentIndex > currentWords.length) return endSession();
  currentWord = currentWords[currentIndex - 1].word;
  wordStartTime = Date.now(); // Track when this word starts
  wordPrompt.textContent = 'Guess the spelling';
  attemptInput.value = '';
  feedback.innerHTML = '';
  meaningDisplay.style.display = 'none'; // Hide previous meaning
  meaningDisplay.innerHTML = '';
  test.classList.remove('correct', 'incorrect');
  nextBtn.style.display = 'none';
  submitBtn.style.display = 'inline-block';
}

// Listen button (TTS)
listenBtn.addEventListener('click', () => {
  console.log('Listen button clicked, speaking:', currentWord);
  speakWord(currentWord);
});

// Meaning button - fetch definition from API
meaningBtn.addEventListener('click', () => {
  console.log('Meaning button clicked for:', currentWord);
  fetchAndShowMeaning(currentWord);
});

// Submit attempt logic
function submitAttempt() {
  const rawAttempt = attemptInput.value.trim().toLowerCase();
  
  // CSRF: Validate token for state-changing operation
  if (window.csrfProtection) {
    const tokenValidation = window.csrfProtection.validateToken('submitAnswer', 
      window.csrfProtection.getTokenForRequest(), currentUser);
    if (!tokenValidation.valid) {
      console.error('CSRF validation failed:', tokenValidation.error);
      feedback.innerHTML = 'Session expired. Please login again.';
      feedback.style.color = '#ff6b6b';
      return;
    }
  }
  
  // SECURITY: Validate answer length and content
  const answerValidation = window.securityContext?.validateAnswer(rawAttempt);
  
  if (!answerValidation?.valid) {
    const confirmed = confirm('You haven\'t typed anything yet. Are you sure you want to skip this word?');
    if (!confirmed) {
      attemptInput.focus();
      return;
    }
  }
  
  // SECURITY: Check rate limit to prevent spam submissions
  const canSubmit = window.securityContext?.checkRateLimit(currentUser);
  if (!canSubmit) {
    feedback.innerHTML = 'Please wait before submitting again.';
    feedback.style.color = '#ff6b6b';
    setTimeout(() => {
      feedback.innerHTML = '';
    }, 2000);
    return;
  }
  
  const attempt = answerValidation?.trimmed || rawAttempt;
  const correct = attempt === currentWord.toLowerCase();
  const timeSpent = (Date.now() - wordStartTime) / 1000; // Time spent in seconds
  
  console.log('Submit clicked - Attempt:', attempt, 'Current word:', currentWord, 'Correct:', correct);
  
  feedback.innerHTML = correct ? 'Correct! ✅🎉' : `Incorrect ❌ Correct: ${window.securityContext?.escapeForDisplay(currentWord) || currentWord}`;
  test.classList.add(correct ? 'correct' : 'incorrect');
  
  submitBtn.style.display = 'none';
  
  const logEntry = { 
    word: currentWord, 
    attempt, 
    correct, 
    timestamp: Date.now(),
    timeSpent: timeSpent * 1000, // Time in milliseconds
    sessionId,
    user: currentUser,
    grade: currentWords[currentIndex - 1]?.grade,
    testMode: testMode  // Track whether this was practice or test mode
  };
  
  // SECURITY: Validate and queue log entry before Firebase sync
  const logValidation = window.securityContext?.validateAndQueueLog(logEntry);
  if (logValidation && !logValidation.valid) {
    console.error('Log validation failed:', logValidation.error);
    feedback.innerHTML = 'Failed to record answer. Please try again.';
    submitBtn.style.display = 'inline-block';
    return;
  }
  
  logs.push(logEntry);
  saveUserLogsToFirebase(logEntry); // Save to Firebase
  
  if (correct) {
    // Auto-proceed to next question after 2 seconds for correct answers
    console.log('Correct answer - auto-advancing in 2 seconds');
    setTimeout(() => {
      console.log('Timeout fired, calling nextWord()');
      nextWord();
    }, 2000);
  } else {
    // Show next button for wrong answers to let user review
    console.log('Wrong answer - showing next button');
    nextBtn.style.display = 'inline-block';
  }
}

// Submit attempt button click
submitBtn.addEventListener('click', submitAttempt);

// Enter key to submit attempt
attemptInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    submitAttempt();
  }
});

// Next button
nextBtn.addEventListener('click', nextWord);

// End session
endBtn.addEventListener('click', endSession);

async function endSession() {
  // GAMIFICATION: Process session end
  if (window.gamification) {
    const sessionLogs = logs.filter(l => l.sessionId === sessionId);
    const correct = sessionLogs.filter(l => l.correct).length;
    const total = sessionLogs.length;
    const totalTime = sessionLogs.reduce((sum, l) => sum + (l.timeSpent || 0), 0);
    
    const levelBefore = window.gamification.userStats.level;
    const results = window.gamification.processSessionEnd({
      correct: correct,
      total: total,
      totalTime: totalTime,
      pointsEarned: sessionLogs.reduce((sum, l) => sum + (l.pointsEarned || 0), 0),
      levelBefore: levelBefore
    });

    // Trigger confetti on level up
    if (results.levelUp) {
      window.gamification.triggerConfetti();
      console.log(`🎉 Level up! You're now level ${window.gamification.userStats.level}`);
    }

    // Show new badges earned
    results.newBadges.forEach(badge => {
      console.log(`🏆 New Badge: ${badge.name}`);
    });

    // Save to Firebase
    await window.gamification.saveGameificationData(currentUser);
    window.gamification.updateGameificationUI();
  }

  test.style.display = 'none';
  home.style.display = 'block';
  currentIndex = 0;
}

// Custom upload
// Custom upload feature removed from current UI
// Code preserved below for future use:
/*
customBtn.addEventListener('click', () => uploadInput.click());
uploadInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      let newWords;
      if (file.name.endsWith('.json')) {
        newWords = JSON.parse(ev.target.result);
      } else if (file.name.endsWith('.csv')) {
        // Simple CSV parse (assumes headers: id,grade,word)
        const lines = ev.target.result.split('\n').slice(1);
        newWords = lines.map(line => {
          const [id, grade, word] = line.split(',');
          return { id: parseInt(id), grade, word: word.trim() };
        }).filter(w => w.word);
      }
      words = [...words, ...newWords];
      alert('Custom words added successfully!');
      // Optionally save back to localStorage for persistence
      localStorage.setItem('customWords', JSON.stringify(newWords));
    } catch (err) {
      alert('Error parsing file: ' + err.message);
    }
  };
  reader.readAsText(file);
});
*/

// View trends
trendsBtn.addEventListener('click', showTrends);

// Analytics tab switching
const tabPractice = document.getElementById('tab-practice');
const tabTest = document.getElementById('tab-test');
const practiceContent = document.getElementById('practice-content');
const testContent = document.getElementById('test-content');

if (tabPractice && tabTest) {
  tabPractice.addEventListener('click', () => {
    practiceContent.style.display = 'block';
    testContent.style.display = 'none';
    tabPractice.style.background = '#667eea';
    tabPractice.style.color = 'white';
    tabTest.style.background = '#ccc';
    tabTest.style.color = '#333';
  });

  tabTest.addEventListener('click', () => {
    practiceContent.style.display = 'none';
    testContent.style.display = 'block';
    tabTest.style.background = '#667eea';
    tabTest.style.color = 'white';
    tabPractice.style.background = '#ccc';
    tabPractice.style.color = '#333';
  });
}

// GAMIFICATION: View Badges/Achievements
const badgesBtn = document.getElementById('view-badges');
if (badgesBtn) {
  badgesBtn.addEventListener('click', () => {
    home.style.display = 'none';
    document.getElementById('badges-view').style.display = 'block';
    if (window.gamification) {
      window.gamification.updateBadgePage();
    }
  });
}

// GAMIFICATION: Back from Badges
const backFromBadgesBtn = document.getElementById('back-from-badges');
if (backFromBadgesBtn) {
  backFromBadgesBtn.addEventListener('click', () => {
    document.getElementById('badges-view').style.display = 'none';
    home.style.display = 'block';
  });
}

async function showTrends() {
  home.style.display = 'none';
  trendsView.style.display = 'block';
  
  // Load data from Firebase first
  await loadUserLogsFromFirebase();
  
  // Filter logs to only current user's practice sessions (not test mode)
  const practiceLogs = logs.filter(l => l.user === currentUser && (!l.testMode || l.testMode === 'practice'));
  
  console.log('Showing trends. Current user practice logs:', practiceLogs.length);
  
  if (practiceLogs.length === 0) {
    accuracyP.textContent = 'No data yet. Start a practice to see your trends!';
    document.getElementById('session-stats').textContent = '';
    document.getElementById('wrong-words').innerHTML = '';
    document.getElementById('correct-words').innerHTML = '';
    document.getElementById('time-stats').textContent = '';
    return;
  }
  
  // === ACCURACY STATS ===
  const total = practiceLogs.length;
  const correctCount = practiceLogs.filter(l => l.correct).length;
  const incorrectCount = total - correctCount;
  const accuracy = ((correctCount / total) * 100).toFixed(2);
  accuracyP.textContent = `${accuracy}%`;
  
  // === POPULATE KPI CARDS ===
  document.getElementById('kpi-total').textContent = total;
  document.getElementById('kpi-correct').textContent = correctCount;
  document.getElementById('kpi-incorrect').textContent = incorrectCount;
  
  // === SESSION STATS ===
  const sessions = [...new Set(practiceLogs.map(l => l.sessionId))].sort((a, b) => a - b);
  const questionsPerSession = Math.round(total / sessions.length);
  document.getElementById('kpi-sessions').textContent = sessions.length;
  
  // === LAST SESSION STATS ===
  // Get the most recent practice session (last in sorted order)
  const lastSessionId = sessions[sessions.length - 1];
  const lastSessionLogs = practiceLogs.filter(l => l.sessionId === lastSessionId);
  const lastSessionCorrect = lastSessionLogs.filter(l => l.correct).length;
  const lastSessionTotal = lastSessionLogs.length;
  const lastSessionAccuracy = ((lastSessionCorrect / lastSessionTotal) * 100).toFixed(0);
  const lastSessionTime = Math.round(lastSessionLogs.reduce((sum, l) => sum + (l.timeSpent || 0), 0) / 1000);
  
  const lastSessionHtml = `
    <div class="session-stat">
      <div class="session-stat-label">Questions</div>
      <div class="session-stat-value">${lastSessionTotal}</div>
    </div>
    <div class="session-stat">
      <div class="session-stat-label">Correct</div>
      <div class="session-stat-value" style="color: #4CAF50;">${lastSessionCorrect}</div>
    </div>
    <div class="session-stat">
      <div class="session-stat-label">Incorrect</div>
      <div class="session-stat-value" style="color: #F44336;">${lastSessionTotal - lastSessionCorrect}</div>
    </div>
    <div class="session-stat">
      <div class="session-stat-label">Accuracy</div>
      <div class="session-stat-value">${lastSessionAccuracy}%</div>
    </div>
    <div class="session-stat">
      <div class="session-stat-label">Time</div>
      <div class="session-stat-value">${lastSessionTime}s</div>
    </div>
  `;
  document.getElementById('last-session-content').innerHTML = lastSessionHtml;
  
  // === LAST SESSION WRONG WORDS ===
  const lastSessionWrongWords = lastSessionLogs.filter(l => !l.correct).map(l => l.word);
  let lastSessionWrongWordsHtml = '';
  
  if (lastSessionWrongWords.length > 0) {
    lastSessionWrongWordsHtml = `
      <div style="border-top: 2px solid #E3F2FD; padding-top: 12px;">
        <h4 style="font-size: 14px; color: #1565C0; margin-bottom: 8px;">❌ Words to Practice</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${lastSessionWrongWords.map(word => `
            <span style="
              background: #FFEBEE;
              color: #C62828;
              padding: 6px 12px;
              border-radius: 20px;
              font-size: 13px;
              font-weight: 600;
            ">${word}</span>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  document.getElementById('last-session-wrong-words').innerHTML = lastSessionWrongWordsHtml;
  
  // === TIME ANALYTICS (moved up to populate KPI) ===
  const totalTimeMs = practiceLogs.reduce((sum, l) => sum + (l.timeSpent || 0), 0);
  const avgTimePerWord = Math.round(totalTimeMs / total / 1000);
  document.getElementById('kpi-avgtime').textContent = avgTimePerWord + 's';
  
  // === WRONG WORDS ANALYTICS ===
  const wrongWordStats = {};
  practiceLogs.forEach(log => {
    if (!log.correct) {
      if (!wrongWordStats[log.word]) {
        wrongWordStats[log.word] = { wrong: 0, correct: 0, timesAsked: 0, totalTime: 0 };
      }
      wrongWordStats[log.word].wrong++;
      wrongWordStats[log.word].totalTime += log.timeSpent || 0;
      wrongWordStats[log.word].timesAsked++;
    }
  });
  
  // Also count correct attempts for success rate
  practiceLogs.forEach(log => {
    if (!wrongWordStats[log.word]) {
      wrongWordStats[log.word] = { wrong: 0, correct: 0, timesAsked: 0, totalTime: 0 };
    }
    if (log.correct) {
      wrongWordStats[log.word].correct++;
    }
    wrongWordStats[log.word].timesAsked++;
    wrongWordStats[log.word].totalTime += log.timeSpent || 0;
  });
  
  // Sort by wrong count and show top 10
  const sortedWrongWords = Object.entries(wrongWordStats)
    .sort((a, b) => b[1].wrong - a[1].wrong)
    .slice(0, 10);
  
  const wrongWordsHtml = sortedWrongWords.map(([word, stats]) => {
    const successRate = ((stats.correct / stats.timesAsked) * 100).toFixed(0);
    return `<div class="word-item">
      <div><strong>${word}</strong></div>
      <div class="word-stat">${stats.correct}/${stats.timesAsked} correct (${successRate}%)</div>
    </div>`;
  }).join('');
  
  document.getElementById('wrong-words').innerHTML = wrongWordsHtml || '<p style="padding: 1rem;">No incorrect words yet!</p>';
  
  // === CORRECT WORDS ANALYTICS ===
  const correctWordStats = {};
  practiceLogs.forEach(log => {
    if (log.correct) {
      if (!correctWordStats[log.word]) {
        correctWordStats[log.word] = { count: 0, totalTime: 0 };
      }
      correctWordStats[log.word].count++;
      correctWordStats[log.word].totalTime += log.timeSpent || 0;
    }
  });
  
  const sortedCorrectWords = Object.entries(correctWordStats)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);
  
  const correctWordsHtml = sortedCorrectWords.map(([word, stats]) => {
    return `<div class="word-item">
      <div><strong>${word}</strong></div>
      <div class="word-stat">${stats.count} times correct</div>
    </div>`;
  }).join('');
  
  document.getElementById('correct-words').innerHTML = correctWordsHtml || '<p style="padding: 1rem;">No correct words yet!</p>';
  
  // === WORDS STILL STRUGGLING (LATEST ATTEMPT) ===
  // Get the latest attempt for each word across all sessions
  const wordLatestAttempt = {};
  practiceLogs.forEach(log => {
    if (!wordLatestAttempt[log.word] || log.timestamp > wordLatestAttempt[log.word].timestamp) {
      wordLatestAttempt[log.word] = log;
    }
  });
  
  // Filter words that were wrong in their latest attempt
  const strugglingWords = Object.values(wordLatestAttempt)
    .filter(log => !log.correct)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20);
  
  const strugglingWordsHtml = strugglingWords.map(word => {
    const attemptDate = new Date(word.timestamp);
    const dateStr = attemptDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = attemptDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `<div class="word-item">
      <div><strong>${word.word}</strong></div>
      <div class="word-stat">${dateStr} at ${timeStr}</div>
    </div>`;
  }).join('');
  
  document.getElementById('struggling-words').innerHTML = strugglingWordsHtml || '<p style="padding: 1rem;">No struggling words yet!</p>';
  
  // === TIME ANALYTICS ===
  const fastestWord = practiceLogs.reduce((min, l) => l.timeSpent < (min.timeSpent || Infinity) ? l : min, {});
  const slowestWord = practiceLogs.reduce((max, l) => l.timeSpent > (max.timeSpent || 0) ? l : max, {});
  
  document.getElementById('time-stats').innerHTML = 
    `<strong>Total Time:</strong> ${Math.round(totalTimeMs / 60000)}m<br>` +
    `<strong>Average/Word:</strong> ${avgTimePerWord}s<br>` +
    `<strong>Fastest:</strong> ${fastestWord.word || 'N/A'} (${fastestWord.timeSpent ? Math.round(fastestWord.timeSpent / 1000) : 0}s)<br>` +
    `<strong>Slowest:</strong> ${slowestWord.word || 'N/A'} (${slowestWord.timeSpent ? Math.round(slowestWord.timeSpent / 1000) : 0}s)`;
  
  // === SESSION ACCURACY CHART ===
  const sessionAcc = sessions.map(sid => {
    const sLogs = practiceLogs.filter(l => l.sessionId === sid);
    return (sLogs.filter(l => l.correct).length / sLogs.length) * 100;
  });
  
  if (window.trendChart instanceof Chart) {
    window.trendChart.destroy();
  }
  
  const accuracyCtx = document.getElementById('accuracy-chart').getContext('2d');
  window.trendChart = new Chart(accuracyCtx, {
    type: 'line',
    data: {
      labels: sessions.map((_, i) => `Session ${i+1}`),
      datasets: [{ 
        label: 'Accuracy %', 
        data: sessionAcc, 
        borderColor: '#667eea', 
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: true,
        borderWidth: 2,
        pointRadius: 5,
        pointBackgroundColor: '#667eea'
      }]
    },
    options: { 
      responsive: true,
      maintainAspectRatio: false,
      scales: { 
        y: { 
          beginAtZero: true, 
          max: 100,
          ticks: { callback: v => v + '%' }
        } 
      },
      plugins: {
        legend: { display: true }
      }
    }
  });
  
  // === CORRECT vs INCORRECT CHART ===
  if (window.correctIncorrectChart instanceof Chart) {
    window.correctIncorrectChart.destroy();
  }
  
  const correctIncorrectCtx = document.getElementById('correct-incorrect-chart').getContext('2d');
  window.correctIncorrectChart = new Chart(correctIncorrectCtx, {
    type: 'doughnut',
    data: {
      labels: ['Correct', 'Incorrect'],
      datasets: [{
        data: [correctCount, total - correctCount],
        backgroundColor: ['#10b981', '#ef4444'],
        borderColor: ['#059669', '#dc2626'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
  
  // === GRADE PERFORMANCE CHART ===
  if (window.gradePerformanceChart instanceof Chart) {
    window.gradePerformanceChart.destroy();
  }
  
  const gradeStats = {};
  practiceLogs.forEach(log => {
    const word = words.find(w => w.word === log.word);
    const grade = word ? word.grade : 'Unknown';
    if (!gradeStats[grade]) {
      gradeStats[grade] = { correct: 0, total: 0 };
    }
    gradeStats[grade].total++;
    if (log.correct) gradeStats[grade].correct++;
  });
  
  const gradeLabels = Object.keys(gradeStats);
  const gradeAccuracy = gradeLabels.map(g => ((gradeStats[g].correct / gradeStats[g].total) * 100).toFixed(1));
  
  const gradePerformanceCtx = document.getElementById('grade-performance-chart').getContext('2d');
  window.gradePerformanceChart = new Chart(gradePerformanceCtx, {
    type: 'bar',
    data: {
      labels: gradeLabels,
      datasets: [{
        label: 'Accuracy %',
        data: gradeAccuracy,
        backgroundColor: ['#667eea', '#764ba2', '#10b981'],
        borderColor: ['#5568d3', '#6b3a8f', '#059669'],
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { beginAtZero: true, max: 100 }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
  
  // === WORD DIFFICULTY DISTRIBUTION CHART ===
  if (window.difficultyChart instanceof Chart) {
    window.difficultyChart.destroy();
  }
  
  const difficultyDistribution = {};
  practiceLogs.forEach(log => {
    const word = words.find(w => w.word === log.word);
    const grade = word ? word.grade : 'Unknown';
    difficultyDistribution[grade] = (difficultyDistribution[grade] || 0) + 1;
  });
  
  const diffLabels = Object.keys(difficultyDistribution);
  const diffValues = Object.values(difficultyDistribution);
  const colors = ['#667eea', '#764ba2', '#10b981', '#f59e0b', '#ef4444'];
  
  const difficultyCtx = document.getElementById('difficulty-chart').getContext('2d');
  window.difficultyChart = new Chart(difficultyCtx, {
    type: 'pie',
    data: {
      labels: diffLabels,
      datasets: [{
        data: diffValues,
        backgroundColor: colors.slice(0, diffLabels.length),
        borderColor: 'white',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });

  // GAMIFICATION: Load and display leaderboard
  if (window.gamification && firebaseReady) {
    try {
      // Fetch all users' gamification data
      const snapshot = await database.ref('users').once('value');
      const allUsers = [];
      snapshot.forEach(childSnapshot => {
        const userData = childSnapshot.val();
        if (userData.gamification) {
          allUsers.push({
            name: userData.gamification.username || childSnapshot.key,
            points: userData.gamification.totalPoints || 0,
            level: userData.gamification.level || 1
          });
        }
      });
      // Update both leaderboards
      window.gamification.renderLeaderboard(allUsers);
      // Also add to analytics leaderboard
      const analyticsContainer = document.getElementById('analytics-leaderboard');
      if (analyticsContainer) {
        analyticsContainer.innerHTML = '';
        const sortedUsers = [...allUsers].sort((a, b) => (b.points || 0) - (a.points || 0));
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
          analyticsContainer.appendChild(entry);
        });
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  }

  // Load test analytics
  await showTestAnalytics();
}

// === PRACTICE TEST ANALYTICS ===
async function showTestAnalytics() {
  // Filter logs for test mode AND current user only
  const testLogs = logs.filter(l => l.testMode === 'test' && l.user === currentUser);
  
  if (testLogs.length === 0) {
    document.getElementById('test-accuracy').textContent = 'No data yet';
    document.getElementById('test-total').textContent = '0';
    document.getElementById('test-correct').textContent = '0';
    document.getElementById('test-incorrect').textContent = '0';
    document.getElementById('test-sessions').textContent = '0';
    document.getElementById('test-coverage').textContent = '0%';
    return;
  }

  // === TEST ACCURACY STATS ===
  const testTotal = testLogs.length;
  const testCorrect = testLogs.filter(l => l.correct).length;
  const testIncorrect = testTotal - testCorrect;
  const testAccuracy = ((testCorrect / testTotal) * 100).toFixed(2);
  document.getElementById('test-accuracy').textContent = `${testAccuracy}%`;

  // === POPULATE TEST KPI CARDS ===
  document.getElementById('test-total').textContent = testTotal;
  document.getElementById('test-correct').textContent = testCorrect;
  document.getElementById('test-incorrect').textContent = testIncorrect;

  // === TEST SESSIONS ===
  const testSessions = [...new Set(testLogs.map(l => l.sessionId))].sort((a, b) => a - b);
  document.getElementById('test-sessions').textContent = testSessions.length;

  // === WORD COVERAGE ===
  const uniqueWordsInTests = new Set(testLogs.map(l => l.word)).size;
  const totalWords = words.length;
  const coverage = ((uniqueWordsInTests / totalWords) * 100).toFixed(1);
  document.getElementById('test-coverage').textContent = coverage + '%';

  // === LATEST TEST SESSION ===
  // Get the most recent test session (last in sorted order)
  const lastTestSessionId = testSessions[testSessions.length - 1];
  const lastTestLogs = testLogs.filter(l => l.sessionId === lastTestSessionId);
  
  const lastTestCorrect = lastTestLogs.filter(l => l.correct).length;
  const lastTestTotal = lastTestLogs.length;
  const lastTestAccuracy = ((lastTestCorrect / lastTestTotal) * 100).toFixed(0);
  const lastTestTime = Math.round(lastTestLogs.reduce((sum, l) => sum + (l.timeSpent || 0), 0) / 1000);

  const lastTestHtml = `
    <div style="font-size: 12px; color: #666; margin-bottom: 12px; font-style: italic;">📌 Includes complete test (initial + any resumed attempts)</div>
    <div class="session-stat">
      <div class="session-stat-label">Words Tested</div>
      <div class="session-stat-value">${lastTestTotal}</div>
    </div>
    <div class="session-stat">
      <div class="session-stat-label">Correct</div>
      <div class="session-stat-value" style="color: #4CAF50;">${lastTestCorrect}</div>
    </div>
    <div class="session-stat">
      <div class="session-stat-label">Incorrect</div>
      <div class="session-stat-value" style="color: #F44336;">${lastTestTotal - lastTestCorrect}</div>
    </div>
    <div class="session-stat">
      <div class="session-stat-label">Accuracy</div>
      <div class="session-stat-value">${lastTestAccuracy}%</div>
    </div>
    <div class="session-stat">
      <div class="session-stat-label">Time</div>
      <div class="session-stat-value">${lastTestTime}s</div>
    </div>
  `;
  document.getElementById('last-test-content').innerHTML = lastTestHtml;

  // === LAST TEST WRONG WORDS ===
  const lastTestWrongWords = lastTestLogs.filter(l => !l.correct).map(l => l.word);
  let lastTestWrongWordsHtml = '';

  if (lastTestWrongWords.length > 0) {
    lastTestWrongWordsHtml = `
      <div style="border-top: 2px solid #E3F2FD; padding-top: 12px;">
        <h4 style="font-size: 14px; color: #1565C0; margin-bottom: 8px;">❌ Words to Review</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${lastTestWrongWords.map(word => `
            <span style="
              background: #FFEBEE;
              color: #C62828;
              padding: 6px 12px;
              border-radius: 20px;
              font-size: 13px;
              font-weight: 600;
            ">${word}</span>
          `).join('')}
        </div>
      </div>
    `;
  }

  document.getElementById('last-test-wrong-words').innerHTML = lastTestWrongWordsHtml;

  // === TIME ANALYTICS ===
  const totalTestTimeMs = testLogs.reduce((sum, l) => sum + (l.timeSpent || 0), 0);
  const avgTestTimePerWord = Math.round(totalTestTimeMs / testTotal / 1000);
  const fastestTestWord = testLogs.reduce((min, l) => l.timeSpent < (min.timeSpent || Infinity) ? l : min, {});
  const slowestTestWord = testLogs.reduce((max, l) => l.timeSpent > (max.timeSpent || 0) ? l : max, {});

  document.getElementById('test-time-stats').innerHTML = 
    `<strong>Total Time:</strong> ${Math.round(totalTestTimeMs / 60000)}m<br>` +
    `<strong>Average/Word:</strong> ${avgTestTimePerWord}s<br>` +
    `<strong>Fastest:</strong> ${fastestTestWord.word || 'N/A'} (${fastestTestWord.timeSpent ? Math.round(fastestTestWord.timeSpent / 1000) : 0}s)<br>` +
    `<strong>Slowest:</strong> ${slowestTestWord.word || 'N/A'} (${slowestTestWord.timeSpent ? Math.round(slowestTestWord.timeSpent / 1000) : 0}s)`;

  // === TEST WRONG WORDS ===
  const testWrongWordStats = {};
  testLogs.forEach(log => {
    if (!testWrongWordStats[log.word]) {
      testWrongWordStats[log.word] = { wrong: 0, correct: 0, timesAsked: 0 };
    }
    if (log.correct) {
      testWrongWordStats[log.word].correct++;
    } else {
      testWrongWordStats[log.word].wrong++;
    }
    testWrongWordStats[log.word].timesAsked++;
  });

  const sortedTestWrongWords = Object.entries(testWrongWordStats)
    .filter(([_, stats]) => stats.wrong > 0)
    .sort((a, b) => b[1].wrong - a[1].wrong)
    .slice(0, 10);

  const testWrongWordsHtml = sortedTestWrongWords.map(([word, stats]) => {
    const successRate = ((stats.correct / stats.timesAsked) * 100).toFixed(0);
    return `<div class="word-item">
      <div><strong>${word}</strong></div>
      <div class="word-stat">${stats.correct}/${stats.timesAsked} correct (${successRate}%)</div>
    </div>`;
  }).join('');

  document.getElementById('test-wrong-words').innerHTML = testWrongWordsHtml || '<p style="padding: 1rem;">Perfect! All words correct! 🎉</p>';

  // === TEST CORRECT WORDS ===
  const testCorrectWordStats = {};
  testLogs.forEach(log => {
    if (log.correct) {
      if (!testCorrectWordStats[log.word]) {
        testCorrectWordStats[log.word] = { count: 0 };
      }
      testCorrectWordStats[log.word].count++;
    }
  });

  const sortedTestCorrectWords = Object.entries(testCorrectWordStats)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);

  const testCorrectWordsHtml = sortedTestCorrectWords.map(([word, stats]) => {
    return `<div class="word-item">
      <div><strong>${word}</strong></div>
      <div class="word-stat">✅ Correct in ${stats.count} test(s)</div>
    </div>`;
  }).join('');

  document.getElementById('test-correct-words').innerHTML = testCorrectWordsHtml || '<p style="padding: 1rem;">No test results yet</p>';

  // === WORD COVERAGE REPORT ===
  const testedWords = new Set(testLogs.map(l => l.word));
  const notTestedWords = words.filter(w => !testedWords.has(w.word));
  
  let coverageReportHtml = `<div style="font-size: 14px; margin-bottom: 10px;"><strong>Tested: ${testedWords.size}/${words.length} words (${coverage}%)</strong></div>`;
  
  if (notTestedWords.length > 0 && notTestedWords.length <= 20) {
    coverageReportHtml += `<div style="padding: 10px; background: #fff3cd; border-radius: 5px; margin-bottom: 10px;"><strong>📍 Not Yet Tested (${notTestedWords.length}):</strong><br>`;
    coverageReportHtml += notTestedWords.map(w => w.word).join(', ');
    coverageReportHtml += '</div>';
  } else if (notTestedWords.length > 20) {
    coverageReportHtml += `<div style="padding: 10px; background: #fff3cd; border-radius: 5px;"><strong>📍 Remaining Words:</strong> ${notTestedWords.length} words not yet tested</div>`;
  }

  document.getElementById('test-coverage-report').innerHTML = coverageReportHtml;

  // === TEST SESSION ACCURACY CHART ===
  const testSessionAcc = testSessions.map(sid => {
    const sLogs = testLogs.filter(l => l.sessionId === sid);
    return (sLogs.filter(l => l.correct).length / sLogs.length) * 100;
  });

  if (window.testAccuracyChart instanceof Chart) {
    window.testAccuracyChart.destroy();
  }

  const testAccuracyCtx = document.getElementById('test-accuracy-chart').getContext('2d');
  window.testAccuracyChart = new Chart(testAccuracyCtx, {
    type: 'line',
    data: {
      labels: testSessions.map((_, i) => `Test ${i+1}`),
      datasets: [{ 
        label: 'Accuracy %', 
        data: testSessionAcc, 
        borderColor: '#f59e0b', 
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        fill: true,
        borderWidth: 2,
        pointRadius: 5,
        pointBackgroundColor: '#f59e0b'
      }]
    },
    options: { 
      responsive: true,
      maintainAspectRatio: false,
      scales: { 
        y: { 
          beginAtZero: true, 
          max: 100,
          ticks: { callback: v => v + '%' }
        } 
      },
      plugins: {
        legend: { display: true }
      }
    }
  });

  // === TEST CORRECT vs INCORRECT CHART ===
  if (window.testCorrectIncorrectChart instanceof Chart) {
    window.testCorrectIncorrectChart.destroy();
  }

  const testCorrectIncorrectCtx = document.getElementById('test-correct-incorrect-chart').getContext('2d');
  window.testCorrectIncorrectChart = new Chart(testCorrectIncorrectCtx, {
    type: 'doughnut',
    data: {
      labels: ['Correct', 'Incorrect'],
      datasets: [{
        data: [testCorrect, testTotal - testCorrect],
        backgroundColor: ['#10b981', '#ef4444'],
        borderColor: ['#059669', '#dc2626'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });

  // === TEST GRADE PERFORMANCE CHART ===
  if (window.testGradePerformanceChart instanceof Chart) {
    window.testGradePerformanceChart.destroy();
  }

  const testGradeStats = {};
  testLogs.forEach(log => {
    const word = words.find(w => w.word === log.word);
    const grade = word ? word.grade : 'Unknown';
    if (!testGradeStats[grade]) {
      testGradeStats[grade] = { correct: 0, total: 0 };
    }
    testGradeStats[grade].total++;
    if (log.correct) testGradeStats[grade].correct++;
  });

  const testGradeLabels = Object.keys(testGradeStats).sort((a, b) => {
    const aNum = parseInt(a);
    const bNum = parseInt(b);
    if (isNaN(aNum) && isNaN(bNum)) return a.localeCompare(b);
    if (isNaN(aNum)) return 1;
    if (isNaN(bNum)) return -1;
    return aNum - bNum;
  });
  const testGradeAccuracy = testGradeLabels.map(g => ((testGradeStats[g].correct / testGradeStats[g].total) * 100).toFixed(1));

  const testGradePerformanceCtx = document.getElementById('test-grade-performance-chart').getContext('2d');
  window.testGradePerformanceChart = new Chart(testGradePerformanceCtx, {
    type: 'bar',
    data: {
      labels: testGradeLabels,
      datasets: [{
        label: 'Accuracy %',
        data: testGradeAccuracy,
        backgroundColor: ['#667eea', '#764ba2', '#10b981', '#f59e0b', '#ef4444'],
        borderColor: ['#5568d3', '#6b3a8f', '#059669', '#d97706', '#dc2626'],
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { beginAtZero: true, max: 100 }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });

  // === TEST DIFFICULTY DISTRIBUTION CHART ===
  if (window.testDifficultyChart instanceof Chart) {
    window.testDifficultyChart.destroy();
  }

  const testDifficultyDistribution = {};
  testLogs.forEach(log => {
    const word = words.find(w => w.word === log.word);
    const grade = word ? word.grade : 'Unknown';
    testDifficultyDistribution[grade] = (testDifficultyDistribution[grade] || 0) + 1;
  });

  const testDiffLabels = Object.keys(testDifficultyDistribution);
  const testDiffValues = Object.values(testDifficultyDistribution);
  const testColors = ['#667eea', '#764ba2', '#10b981', '#f59e0b', '#ef4444'];

  const testDifficultyCtx = document.getElementById('test-difficulty-chart').getContext('2d');
  window.testDifficultyChart = new Chart(testDifficultyCtx, {
    type: 'pie',
    data: {
      labels: testDiffLabels,
      datasets: [{
        data: testDiffValues,
        backgroundColor: testColors.slice(0, testDiffLabels.length),
        borderColor: 'white',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

// Back to home
backHomeBtn.addEventListener('click', () => {
  trendsView.style.display = 'none';
  home.style.display = 'block';
});

// GAMIFICATION: Initialize gamification system on page load
window.addEventListener('load', () => {
  if (window.gamification) {
    console.log('✅ Gamification system initialized');
    console.log('🏆 Available badges:', Object.keys(window.gamification.BADGES).length);
    console.log('Badges:', Object.keys(window.gamification.BADGES).map(b => window.gamification.BADGES[b].name).join(', '));
  } else {
    console.warn('⚠️ Gamification script not loaded - some features may be unavailable');
  }
});