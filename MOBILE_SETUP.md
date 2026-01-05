# Spelling Bee Mobile App - Setup Guide

## 📋 Prerequisites

- **Mac** ✓ (you have this)
- **Node.js** 16+ 
- **npm** or **yarn**
- **Xcode** (from App Store)
- **Apple Developer Account** ($99/year for publishing)

---

## 🚀 Quick Start (5 minutes)

### Step 1: Initialize React Native + Capacitor

```bash
# Navigate to mobile folder
cd mobile

# Create React app
npx create-react-app . --template typescript

# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/ios

# Initialize Capacitor
npx cap init
# When prompted:
# - App name: Spelling Bee
# - App Package: com.sansin.spellingbee
# - Directory: src

# Install necessary packages
npm install firebase react-router-dom chart.js react-chartjs-2
npm install @capacitor/filesystem @capacitor/permissions

# Add iOS platform
npx cap add ios
```

### Step 2: Check if Xcode is installed

```bash
xcode-select --print-path
# Should return: /Applications/Xcode.app/Contents/Developer
```

If not installed:
- Open App Store
- Search "Xcode"
- Click "Get" → Install

### Step 3: Open in Xcode

```bash
# This opens the Xcode project
npx cap open ios
```

### Step 4: Build for iOS

```bash
# From mobile folder
npm run build
npx cap sync
npx cap open ios
```

---

## 📁 Project Structure

```
mobile/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/            # Screen pages (Login, Home, Test, Analytics)
│   ├── App.tsx           # Main app component
│   ├── index.tsx         # Entry point
│   └── App.css           # Styles
├── ios/                  # Xcode project (auto-generated)
├── package.json          # Dependencies
├── capacitor.config.ts   # Capacitor config
├── tsconfig.json         # TypeScript config
└── .gitignore
```

---

## 🔄 How to Use Shared Code

### Example: In `mobile/src/pages/Home.tsx`

```typescript
import { getPrioritizedWords, calculateAnalytics } from '../../shared';

// Use shared functions
const prioritizedWords = getPrioritizedWords(words, logs, grade);
const analytics = calculateAnalytics(logs, words);
```

---

## 📦 Next Steps (in this order)

1. **Setup Mobile Project** (you run the commands above)
2. **Create Mobile UI Components** (we provide these)
3. **Integrate Firebase** (same config as web)
4. **Test on Simulator** (iPhone 15 simulator)
5. **Configure App Store** (icons, descriptions)
6. **Submit to App Store** (Apple review)

---

## ⚠️ Important Notes

### Version Control
```bash
# Ignore these directories (already in .gitignore)
mobile/node_modules/
mobile/ios/Pods/
mobile/.capacitor/
```

### Keep Web & Mobile in Sync
```bash
# After making changes to shared/
cd mobile
npm run build
npx cap sync
```

### Common Commands
```bash
# From mobile/ folder:
npm start              # Start dev server
npm run build          # Build for production
npx cap sync           # Sync changes to Xcode project
npx cap open ios       # Open Xcode
npm test               # Run tests
```

---

## 🎯 First Mobile Test

```bash
# From mobile folder
npm run build
npx cap sync ios
npx cap open ios
# In Xcode, press ▶️ (Play button) or Cmd+R
# Wait for simulator to load
```

---

## 🆘 Troubleshooting

### Node.js not installed?
```bash
# Install via Homebrew
brew install node
```

### npm permission error?
```bash
sudo npm install -g npm@latest
```

### Xcode build error?
```bash
cd mobile/ios
pod deintegrate
pod install
cd ..
npx cap sync
npx cap open ios
```

---

## 📞 Support Commands

```bash
# Check what's installed
node --version     # Should be v16+
npm --version      # Should be 8+
npx cap --version  # Should be latest

# Check Git status
git status
git log --oneline -5
```

---

## ✅ Checklist Before Next Steps

- [ ] Node.js v16+ installed
- [ ] Xcode installed
- [ ] Mobile folder created
- [ ] Capacitor initialized
- [ ] iOS platform added
- [ ] Project opens in Xcode
- [ ] Shared code accessible

---

**Once you complete these steps, reply with:**
```
✅ Mobile setup complete
```

Then I'll provide:
1. Mobile UI components
2. Firebase integration
3. Complete pages (Login, Home, Test, Analytics)
4. iOS simulator testing guide
