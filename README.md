# 🐝 Spelling Bee Practice App

A fully-featured spelling bee practice application with user authentication, cloud data persistence, smart word prioritization, and comprehensive analytics. Perfect for students to practice spelling with instant feedback and detailed progress tracking.

**Live Demo:** [https://sansin.github.io/spelling-bee-app](https://sansin.github.io/spelling-bee-app)  
**Current Version:** v1.1 (January 4, 2026)

---

## ✨ Features

### 📚 Core Functionality
- **2000+ Words Database** - Organized by difficulty levels (One Bee, Two Bee, Three Bee)
- **Natural Voice Synthesis** - Hear words pronounced using system voices (US English)
- **Instant Feedback** - Immediate correct/incorrect responses with spelling corrections
- **Session Tracking** - Track all attempts with timestamps and timing metrics

### 📖 Word Definitions (NEW in v1.1)
- **Dynamic Definition Lookup** - Fetch real-time definitions from Free Dictionary API
- **One-Click Learning** - Click "🔊 Speak Definition" to see definition and hear it spoken
- **No Word Spoilers** - Word is hidden while showing only the definition text
- **Auto-Pronunciation** - Definition automatically reads aloud using Web Speech API
- **Usage Examples** - See real usage examples for better context understanding

### 👤 User Management
- **User Profiles** - Create and manage multiple user accounts
- **Cloud Data Sync** - All data synced to Firebase Realtime Database
- **Cross-Device Access** - Access your progress from any device
- **Local Backup** - Works offline with localStorage fallback

### 🎯 Smart Word Prioritization
The app intelligently selects words based on:
- **Mistake Frequency** - Words you frequently get wrong appear more often
- **Recency** - Recently missed words get higher priority
- **Success Streaks** - Mastered words appear less frequently
- **Coverage** - Less-asked words get occasional practice
- **New Words** - New entries prioritized for first attempts

### 📊 Advanced Analytics
- **Accuracy Metrics** - Overall success rate and detailed statistics
- **Top 10 Mistakes** - See your most challenging words with success rates
- **Mastered Words** - Track words you've conquered (10+ correct)
- **Time Analytics** - Total, average, fastest, and slowest word timing
- **Trend Chart** - Visual representation of accuracy across sessions
- **KPI Dashboard** - 6 key metrics at a glance (accuracy, total, correct, incorrect, sessions, avg time)

### 🎙️ Voice Selection
- **Multiple Voices** - Choose from all installed US English voices
- **Auto-Detection** - Automatically finds the best available voice
- **System Integration** - Uses macOS system voices for natural pronunciation
- **Definition Speech** - Separate voice control for reading definitions

### 📱 Mobile Optimization (Improved in v1.1)
- **Responsive Design** - Works flawlessly on phones, tablets, and desktops
- **Optimized Analytics** - Mobile-friendly KPI dashboard and charts
- **Touch-Friendly UI** - Large buttons and proper spacing for mobile use
- **Cross-Device Sync** - Data syncs seamlessly across all devices

---

## 🚀 Getting Started

### Option 1: Online (GitHub Pages)
Simply visit: [https://sansin.github.io/spelling-bee-app](https://sansin.github.io/spelling-bee-app)

No installation needed! Your data is automatically synced to the cloud.

### Option 2: Local Installation

#### Prerequisites
- Python 3.x
- Git
- Modern web browser (Chrome, Safari, Firefox)

#### Steps
1. **Clone the repository**
   ```bash
   git clone https://github.com/sansin/spelling-bee-app.git
   cd spelling-bee-app
   ```

2. **Start local server**
   ```bash
   python3 -m http.server 3000
   ```

3. **Open in browser**
   ```
   http://localhost:3000
   ```

---

## 📖 How to Use

### 1. Login
- Enter your name to create/access your profile
- Your data is stored securely in Firebase

### 2. Select Difficulty
- Choose a grade level (One Bee, Two Bee, Three Bee)
- Or select "All Grades" for mixed difficulty

### 3. Select Voice (Optional)
- Choose your preferred voice from the dropdown
- Defaults to best available US English voice if not selected

### 4. Start Practicing
- Click "Listen 🎤" to hear the word pronounced
- Click "🔊 Speak Definition" to learn the word's meaning (NEW in v1.1)
  - Definition and usage example display on screen
  - Definition is automatically read aloud
  - Word itself is hidden to avoid spoilers
- Type your spelling attempt in the text box
- Click "Submit" to check your answer
- Click "Next" to move to the next word
- Click "End Session" to finish and see analytics

### 5. Review Trends
- Click "View Trends" on the home screen
- See accuracy stats, problem words, and progress charts
- View KPI cards showing:
  - Accuracy Rate
  - Total Questions Asked
  - Correct Answers
  - Incorrect Answers
  - Number of Sessions
  - Average Time per Word
- All data persists across sessions

---

## 🛠️ Technical Stack

| Component | Technology | Details |
|-----------|-----------|---------|
| Frontend | HTML5/CSS3/JavaScript | ES6+ modern JavaScript |
| Database | Firebase Realtime DB | Cloud data persistence |
| Voice | Web Speech API | Browser-native TTS |
| Charts | Chart.js | Data visualization |
| Hosting | GitHub Pages | Free static hosting |

### Firebase Integration
- Project: `spelling-bee-app-c1e76`
- Realtime Database for user logs
- Automatic sync across devices
- LocalStorage backup for offline access

---

## 📊 Data Structure

### User Logs Entry
Each spelling attempt is recorded with:
```json
{
  "word": "example",
  "attempt": "exampl",
  "correct": false,
  "timestamp": 1704375600000,
  "timeSpent": 5320,
  "sessionId": 1704375500000,
  "user": "username"
}
```

### Grade Levels
- **One Bee** - Basic words (grades 1-2)
- **Two Bee** - Intermediate words (grades 3-4)  
- **Three Bee** - Advanced words (grades 5+)

---

## 🎮 Word Prioritization Algorithm

The app uses a 5-factor scoring system to select words intelligently:

```
Score = MistakeFrequency(0-50) 
      + MistakeRecency(0-30) 
      - SuccessStreakPenalty(0-20)
      + CoverageBonus(0-20)
      + NewWordBonus(100)
```

Words are sorted by score (highest first) and shuffled within similar ranges for variety.

---

## 📱 Browser Support

- ✅ Chrome/Edge (88+)
- ✅ Safari (14+)
- ✅ Firefox (87+)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

**Note:** Requires Web Speech API support

---

## 🔐 Privacy & Security

- All data stored in Firebase Realtime Database
- User authentication via username (no password required for demo)
- LocalStorage backup for offline scenarios
- No sensitive data exposed in frontend
- CORS handled securely through Firebase SDK

---

## 📁 Project Structure

```
spelling-bee-app/
├── index.html              # Main UI
├── script.js              # Core logic
├── styles.css             # Styling
├── README.md              # This file
├── STABLE_VERSION.md      # Feature documentation
└── data/
    └── words.json         # Word database (2000+ words)
```

---

## 🚀 Deployment

### GitHub Pages (Automatic)
Push to `main` branch - automatically deployed to GitHub Pages

### Local Testing
```bash
python3 -m http.server 3000
# Visit http://localhost:3000
```

---

## 📝 Version History

### v1.0 (January 4, 2026) - Stable Release
- ✅ Complete user authentication system
- ✅ Firebase cloud integration
- ✅ Smart word prioritization
- ✅ Comprehensive analytics dashboard
- ✅ Voice selector with US English support
- ✅ Cross-device data sync
- ✅ 2000+ word database
- ✅ GitHub Pages deployment

See [STABLE_VERSION.md](STABLE_VERSION.md) for detailed feature list.

---

## 🐛 Known Limitations

1. **Voice Quality**: Limited to system-installed voices
2. **Custom Words**: UI exists but requires backend implementation
3. **Offline Mode**: Limited to previously cached data
4. **Export**: No built-in CSV/PDF export

---

## 🎯 Future Features

- Custom word import/upload
- Export analytics as CSV/PDF
- Multi-language support
- Competitive multiplayer mode
- Spaced repetition algorithm
- Audio pronunciation recording
- Mobile native app (React Native)
- Premium voice options (Google Cloud, Azure, Polly)

---

## 📞 Support & Feedback

For issues, suggestions, or feedback:
1. Open an issue on GitHub
2. Reference the stable branch: `stable-v1.0`
3. Include error details and browser information

---

## 📄 License

MIT License - Free to use, modify, and distribute

---

## 🎓 Educational Use

Perfect for:
- **Students** - Practice spelling independently with instant feedback
- **Teachers** - Classroom practice with personal progress tracking
- **Parents** - Home tutoring with analytics insights
- **Language Learners** - Pronunciation and spelling practice

---

**Made with ❤️ for spelling practice**

Latest Release: **v1.0** (January 4, 2026)