# 🚀 Quick Reference Guide

## Your Modular Codebase

```
spelling-bee-app/
├── web/              (Your working web app)
├── shared/           (Reusable code for both)
├── mobile/           (iOS app - being built)
└── docs/             (Documentation)
```

---

## What Each Folder Does

### `web/` - Your Existing Web App
- **Status:** ✅ Complete and working
- **Files:** `index.html`, `script.js`, `styles.css`
- **Access:** http://localhost:8000
- **Deploy:** Git push → GitHub Pages
- **Change When:** Want to update the web app

### `shared/` - Reusable Code
- **Status:** ✅ Just created
- **Contains:** TypeScript code for both platforms
- **Files:** types, Firebase config, algorithms, utilities
- **Access:** Both web and mobile import from here
- **Change When:** Fix algorithm, update types, etc.

### `mobile/` - iOS App (In Progress)
- **Status:** 🏗️ Setup in progress
- **Framework:** React + Capacitor
- **Will Have:** Same features as web, optimized for iOS
- **Deploy:** Build → App Store submission
- **Change When:** Adding mobile-specific features

---

## 📦 Shared Code Breakdown

| File | Purpose | Users |
|------|---------|-------|
| `types.ts` | Data types (Word, Log, User) | web, mobile |
| `firebaseConfig.ts` | Firebase credentials | web, mobile |
| `wordPrioritization.ts` | 5-factor word algorithm | web, mobile |
| `utils.ts` | Analytics, definitions, helpers | web, mobile |

---

## 🔄 Development Workflow

### Update Web App Only
```bash
cd /Users/sandeepsingarapu/Documents/spelling-bee-app/web
# Edit script.js or styles.css
git add web/
git commit -m "Update web feature"
git push
# Live on GitHub Pages in 1 minute
```

### Update Shared Code (Affects Both)
```bash
cd /Users/sandeepsingarapu/Documents/spelling-bee-app/shared
# Edit types.ts, utils.ts, etc.
git add shared/
git commit -m "Update shared code"
git push
# Web uses immediately (if integrated)
# Mobile uses after npm rebuild
```

### Update Mobile App Only
```bash
cd /Users/sandeepsingarapu/Documents/spelling-bee-app/mobile
# Edit React components
git add mobile/
git commit -m "Update mobile feature"
git push
# Need to rebuild and submit to App Store
```

---

## ⚙️ Next Commands (Copy-Paste These)

```bash
# Step 1: Navigate to mobile folder
cd /Users/sandeepsingarapu/Documents/spelling-bee-app/mobile

# Step 2: Create React app
npx create-react-app . --template typescript

# Step 3: Install dependencies
npm install @capacitor/core @capacitor/cli @capacitor/ios firebase react-router-dom chart.js react-chartjs-2

# Step 4: Initialize Capacitor
npx cap init
# Enter: Spelling Bee, com.sansin.spellingbee, src

# Step 5: Add iOS
npx cap add ios

# Step 6: Sync and open Xcode
npx cap sync
npx cap open ios
```

---

## 🎯 Success Points

- ✅ `shared/` folder created with TypeScript code
- ✅ Firebase config in shared (both platforms use it)
- ✅ Word algorithm in shared (both platforms use it)
- ✅ Utility functions in shared (both platforms use it)
- ⏳ `mobile/` folder ready for initialization (next)

---

## 📱 After Mobile Initialization

I'll provide:
1. React components for mobile UI
2. Mobile pages (Login, Home, Test, Analytics)
3. Firebase integration for React Native
4. iOS simulator testing
5. App Store configuration
6. Publishing guide

---

## 📞 Key Files to Reference

| File | Purpose |
|------|---------|
| [MODULAR_SETUP_COMPLETE.md](MODULAR_SETUP_COMPLETE.md) | Complete setup overview |
| [MOBILE_SETUP.md](MOBILE_SETUP.md) | Mobile initialization steps |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Detailed architecture guide |
| [README.md](README.md) | Project overview |
| [RELEASE_NOTES_v1.1.md](RELEASE_NOTES_v1.1.md) | Latest features |

---

## 🚨 When Something Breaks

**Firebase not working?**
- Check: `shared/firebaseConfig.ts` has correct credentials
- Same config in web works, so mobile will too

**Can't import from shared?**
- Check paths: `../../shared/` (mobile) vs `../shared/` (web)
- Check file exists: `shared/index.ts`

**npm error?**
- Try: `rm -rf node_modules package-lock.json`
- Then: `npm install` again

---

## 💡 Pro Tips

1. **Keep shared code clean** - Only pure logic, no UI
2. **Version together** - Update shared = update both
3. **Test before commit** - Make sure web still works
4. **Separate concerns** - UI in `web/` and `mobile/`, logic in `shared/`
5. **Import smart** - Use `index.ts` for cleaner imports

---

## ✅ Checklist to Proceed

- [ ] Understand web/shared/mobile structure
- [ ] Know what's in each shared file
- [ ] Ready to run mobile initialization
- [ ] Have Node.js v16+ installed
- [ ] Have Xcode ready

---

**Ready to initialize the mobile project?**

Open Terminal and run the commands above. When done, reply:

```
✅ Mobile project initialized successfully
```

or if you hit any errors:

```
❌ Error: [describe what happened]
```

---

**You're now ready for Phase 2: Mobile Development! 🎉**
