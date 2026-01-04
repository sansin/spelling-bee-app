// Google Cloud Text-to-Speech API
const GOOGLE_TTS_API_KEY = 'AQ.Ab8RN6KU9MRgt0oyAVj9BKLP-TdXNGj6qjyWrL7VP3sNWGwXuw';
const GOOGLE_TTS_API_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Wait for Firebase to be ready
let firebaseReady = false;
database.ref('.info/connected').on('value', (snap) => {
  if (snap.val() === true) {
    firebaseReady = true;
    console.log('Firebase connected');
  } else {
    firebaseReady = false;
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
const customBtn = document.getElementById('custom');
const uploadInput = document.getElementById('upload');
const trendsBtn = document.getElementById('trends');
const wordPrompt = document.getElementById('word-prompt');
const listenBtn = document.getElementById('listen');
const attemptInput = document.getElementById('attempt');
const submitBtn = document.getElementById('submit');
const nextBtn = document.getElementById('next');
const endBtn = document.getElementById('end');
const feedback = document.getElementById('feedback');
const accuracyP = document.getElementById('accuracy');
const commonMistakesP = document.getElementById('common-mistakes');
const backHomeBtn = document.getElementById('back-home');
const accuracyChart = document.getElementById('accuracy-chart').getContext('2d');

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

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', async () => {
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    currentUser = savedUser;
    await loadUserLogsFromFirebase();
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
  console.log('Login button clicked');
  const username = usernameInput.value.trim();
  console.log('Username entered:', username);
  
  if (!username) {
    alert('Please enter your name');
    return;
  }
  currentUser = username;
  console.log('Current user set to:', currentUser);
  localStorage.setItem('currentUser', username);
  console.log('User saved to localStorage');
  
  await loadUserLogsFromFirebase();
  console.log('Firebase logs loaded, showing home...');
  
  showHome();
  console.log('showHome() called');
});

// Allow Enter key to login
usernameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    loginBtn.click();
  }
});

// Logout handler
logoutBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to logout?')) {
    currentUser = null;
    localStorage.removeItem('currentUser');
    logs = [];
    loginScreen.style.display = 'flex';
    home.style.display = 'none';
    test.style.display = 'none';
    trendsView.style.display = 'none';
    usernameInput.value = '';
  }
});

function showHome() {
  loginScreen.style.display = 'none';
  home.style.display = 'block';
  currentUserDisplay.textContent = `👤 Logged in as: ${currentUser}`;
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

async function speakWord(word) {
  try {
    console.log('Speaking word with Google TTS:', word);
    
    // Call Google Cloud Text-to-Speech API
    const response = await fetch(`${GOOGLE_TTS_API_URL}?key=${GOOGLE_TTS_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { text: word },
        voice: {
          languageCode: 'en-US',
          name: 'en-US-Neural2-C', // Natural female voice
          ssmlGender: 'FEMALE'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 0.9 // Slightly slower for clarity
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google TTS API Error:', errorData);
      throw new Error(`API error ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.audioContent) {
      throw new Error('No audio content in response');
    }

    // Decode base64 audio and play it
    const audioContent = data.audioContent;
    const audioBlob = new Blob([Uint8Array.from(atob(audioContent), c => c.charCodeAt(0))], { type: 'audio/mp3' });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    const audio = new Audio(audioUrl);
    audio.onplay = () => console.log('✓ Audio started');
    audio.onended = () => {
      console.log('✓ Audio ended');
      URL.revokeObjectURL(audioUrl);
    };
    audio.onerror = (e) => {
      console.error('✗ Audio error:', e);
    };
    
    await audio.play();
    console.log('Google TTS played successfully');
    
  } catch (error) {
    console.error('TTS error:', error);
    alert('Voice playback failed: ' + error.message);
  }
}
}

// Start test test
startBtn.addEventListener('click', () => {
  const grade = gradeSelect.value;
  currentWords = getPrioritizedWords(grade);
  if (currentWords.length === 0) return alert('No words available for this grade.');
  sessionId = Date.now();
  startSession();
});


function startSession() {
  home.style.display = 'none';
  test.style.display = 'block';
  nextWord();
}

function nextWord() {
  if (currentIndex >= currentWords.length) return endSession();
  currentWord = currentWords[currentIndex].word;
  wordStartTime = Date.now(); // Track when this word starts
  wordPrompt.textContent = 'Guess the spelling';
  attemptInput.value = '';
  feedback.innerHTML = '';
  test.classList.remove('correct', 'incorrect');
  nextBtn.style.display = 'none';
  submitBtn.style.display = 'inline-block';
  currentIndex++;
}

// Listen button (TTS)
listenBtn.addEventListener('click', () => {
  console.log('Listen button clicked, speaking:', currentWord);
  speakWord(currentWord);
});

// Submit attempt
submitBtn.addEventListener('click', () => {
  const attempt = attemptInput.value.trim().toLowerCase();
  const correct = attempt === currentWord.toLowerCase();
  const timeSpent = Date.now() - wordStartTime; // Time spent on this word
  
  feedback.innerHTML = correct ? 'Correct! ✅🎉' : `Incorrect ❌ Correct: ${currentWord}`;
  test.classList.add(correct ? 'correct' : 'incorrect');
  
  const logEntry = { 
    word: currentWord, 
    attempt, 
    correct, 
    timestamp: Date.now(),
    timeSpent, // Time in milliseconds
    sessionId,
    user: currentUser 
  };
  
  logs.push(logEntry);
  saveUserLogsToFirebase(logEntry); // Save to Firebase
  
  submitBtn.style.display = 'none';
  nextBtn.style.display = 'inline-block';
});

// Next button
nextBtn.addEventListener('click', nextWord);

// End session
endBtn.addEventListener('click', endSession);

function endSession() {
  test.style.display = 'none';
  home.style.display = 'block';
  currentIndex = 0;
}

// Custom upload
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

// View trends
trendsBtn.addEventListener('click', showTrends);

function showTrends() {
  home.style.display = 'none';
  trendsView.style.display = 'block';
  
  console.log('Showing trends. Current logs:', logs.length);
  
  if (logs.length === 0) {
    accuracyP.textContent = 'No data yet. Start a test to see your trends!';
    document.getElementById('session-stats').textContent = '';
    document.getElementById('wrong-words').innerHTML = '';
    document.getElementById('correct-words').innerHTML = '';
    document.getElementById('time-stats').textContent = '';
    return;
  }
  
  // === ACCURACY STATS ===
  const total = logs.length;
  const correctCount = logs.filter(l => l.correct).length;
  const accuracy = ((correctCount / total) * 100).toFixed(2);
  accuracyP.textContent = `📊 ${currentUser}'s Overall Accuracy: ${accuracy}% (${correctCount}/${total} correct)`;
  
  // === SESSION STATS ===
  const sessions = [...new Set(logs.map(l => l.sessionId))];
  const questionsPerSession = Math.round(total / sessions.length);
  document.getElementById('session-stats').textContent = 
    `📌 Total Sessions: ${sessions.length} | Questions per Session: ${questionsPerSession} | Total Questions: ${total}`;
  
  // === WRONG WORDS ANALYTICS ===
  const wrongWordStats = {};
  logs.forEach(log => {
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
  logs.forEach(log => {
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
    const avgTime = Math.round(stats.totalTime / stats.timesAsked / 1000);
    return `<p>
      <strong>${word}</strong> - Wrong: ${stats.wrong}, Correct: ${stats.correct}, 
      Success Rate: ${successRate}%, Avg Time: ${avgTime}s
    </p>`;
  }).join('');
  
  document.getElementById('wrong-words').innerHTML = wrongWordsHtml || '<p>No incorrect words yet!</p>';
  
  // === CORRECT WORDS ANALYTICS ===
  const correctWordStats = {};
  logs.forEach(log => {
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
    const avgTime = Math.round(stats.totalTime / stats.count / 1000);
    return `<p>
      <strong>${word}</strong> - Correct: ${stats.count} times, Avg Time: ${avgTime}s
    </p>`;
  }).join('');
  
  document.getElementById('correct-words').innerHTML = correctWordsHtml || '<p>No correct words yet!</p>';
  
  // === TIME ANALYTICS ===
  const totalTimeMs = logs.reduce((sum, l) => sum + (l.timeSpent || 0), 0);
  const avgTimePerWord = Math.round(totalTimeMs / total / 1000);
  const fastestWord = logs.reduce((min, l) => l.timeSpent < (min.timeSpent || Infinity) ? l : min, {});
  const slowestWord = logs.reduce((max, l) => l.timeSpent > (max.timeSpent || 0) ? l : max, {});
  
  document.getElementById('time-stats').textContent = 
    `⏱️ Total Time: ${Math.round(totalTimeMs / 60000)} minutes | Average per Word: ${avgTimePerWord}s | ` +
    `Fastest: ${fastestWord.word || 'N/A'} (${fastestWord.timeSpent ? Math.round(fastestWord.timeSpent / 1000) : 0}s) | ` +
    `Slowest: ${slowestWord.word || 'N/A'} (${slowestWord.timeSpent ? Math.round(slowestWord.timeSpent / 1000) : 0}s)`;
  
  // === SESSION ACCURACY CHART ===
  const sessionAcc = sessions.map(sid => {
    const sLogs = logs.filter(l => l.sessionId === sid);
    return (sLogs.filter(l => l.correct).length / sLogs.length) * 100;
  });
  
  if (window.trendChart instanceof Chart) {
    window.trendChart.destroy();
  }
  
  window.trendChart = new Chart(accuracyChart, {
    type: 'line',
    data: {
      labels: sessions.map((_, i) => `Session ${i+1}`),
      datasets: [{ 
        label: 'Accuracy %', 
        data: sessionAcc, 
        borderColor: '#667eea', 
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: { 
      responsive: true,
      scales: { 
        y: { 
          beginAtZero: true, 
          max: 100,
          title: { display: true, text: 'Accuracy %' }
        } 
      }
    }
  });
}

// Back to home
backHomeBtn.addEventListener('click', () => {
  trendsView.style.display = 'none';
  home.style.display = 'block';
  // Reset chart if needed
});