// Load elements
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
let logs = JSON.parse(localStorage.getItem('spellingLogs') || '[]');
let currentWords = [];
let currentIndex = 0;
let currentWord = '';
let sessionId = Date.now(); // Unique per session

// Load words from JSON
fetch('data/words.json')
  .then(res => res.json())
  .then(data => {
    words = data;
    // Populate grade options uniquely if needed (optional)
  })
  .catch(err => console.error('Error loading words:', err));

// Function to get prioritized words (wrongs first, then random)
function getPrioritizedWords(grade) {
  filteredWords = words.filter(w => grade === 'all' || w.grade === grade);
  const wrongs = logs.filter(l => !l.correct).reduce((acc, l) => {
    acc[l.word] = (acc[l.word] || 0) + 1;
    return acc;
  }, {});
  return [...filteredWords].sort((a, b) => (wrongs[b.word] || 0) - (wrongs[a.word] || 0));
}
let voices = [];
speechSynthesis.onvoiceschanged = () => {
  voices = speechSynthesis.getVoices();
};

function speakWord(word) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(word);
    
    // Select the best available natural voice
    const preferredVoices = [
      'Google UK English Female', // Chrome on macOS
      'Samantha', // macOS native
      'Victoria', // macOS alternative
      'Google US English', // Chrome fallback
    ];
    
    const availableVoices = speechSynthesis.getVoices();
    const selectedVoice = availableVoices.find(v => 
      preferredVoices.some(pv => v.name.includes(pv))
    ) || availableVoices.find(v => v.lang.startsWith('en'));
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Adjust speech parameters for natural sound
    utterance.rate = 0.9; // Slightly slower (0.9 instead of 1)
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    speechSynthesis.speak(utterance);
  } else {
    alert('Browser does not support text-to-speech.');
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
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(currentWord);
    speechSynthesis.speak(utterance);
  } else {
    alert('Browser does not support text-to-speech.');
  }
});

// Submit attempt
submitBtn.addEventListener('click', () => {
  const attempt = attemptInput.value.trim().toLowerCase();
  const correct = attempt === currentWord.toLowerCase();
  feedback.innerHTML = correct ? 'Correct! ✅🎉' : `Incorrect ❌ Correct: ${currentWord}`;
  test.classList.add(correct ? 'correct' : 'incorrect');
  logs.push({ word: currentWord, attempt, correct, timestamp: Date.now(), sessionId });
  localStorage.setItem('spellingLogs', JSON.stringify(logs));
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
  
  if (logs.length === 0) {
    accuracyP.textContent = 'No data yet.';
    commonMistakesP.textContent = '';
    return;
  }
  
  const total = logs.length;
  const correctCount = logs.filter(l => l.correct).length;
  const accuracy = ((correctCount / total) * 100).toFixed(2);
  accuracyP.textContent = `Overall Accuracy: ${accuracy}%`;
  
  const mistakes = logs.filter(l => !l.correct).reduce((acc, l) => {
    acc[l.word] = (acc[l.word] || 0) + 1;
    return acc;
  }, {});
  const common = Object.entries(mistakes).sort((a, b) => b[1] - a[1]).slice(0, 5);
  commonMistakesP.textContent = 'Common Mistakes: ' + common.map(([word, count]) => `${word} (${count} times)`).join(', ');
  
  // Chart: Accuracy over sessions (group by sessionId)
  const sessions = [...new Set(logs.map(l => l.sessionId))];
  const sessionAcc = sessions.map(sid => {
    const sLogs = logs.filter(l => l.sessionId === sid);
    return (sLogs.filter(l => l.correct).length / sLogs.length) * 100;
  });
  new Chart(accuracyChart, {
    type: 'line',
    data: {
      labels: sessions.map((_, i) => `Session ${i+1}`),
      datasets: [{ label: 'Accuracy %', data: sessionAcc, borderColor: '#007bff' }]
    },
    options: { scales: { y: { beginAtZero: true, max: 100 } } }
  });
}

// Back to home
backHomeBtn.addEventListener('click', () => {
  trendsView.style.display = 'none';
  home.style.display = 'block';
  // Reset chart if needed
});