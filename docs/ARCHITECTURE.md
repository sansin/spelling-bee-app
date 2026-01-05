# Modular Codebase Architecture

## 📁 Directory Structure

```
spelling-bee-app/
│
├── web/                           (YOUR EXISTING WEB APP - UNCHANGED)
│   ├── index.html
│   ├── script.js
│   ├── styles.css
│   ├── data/
│   │   └── words.json
│   └── ...
│
├── shared/                        (REUSABLE CODE FOR BOTH PLATFORMS)
│   ├── index.ts                  # Main export file
│   ├── types.ts                  # TypeScript interfaces
│   ├── firebaseConfig.ts         # Firebase credentials (same for both)
│   ├── wordPrioritization.ts     # Algorithm (5-factor scoring)
│   ├── utils.ts                  # Helper functions
│   └── package.json              # Shared module metadata
│
├── mobile/                        (iOS APP - NEW)
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── pages/               # Screen pages
│   │   ├── App.tsx              # Main component
│   │   └── index.tsx            # Entry point
│   ├── public/                  # Static assets
│   ├── ios/                     # Xcode project (auto-generated)
│   ├── capacitor.config.ts      # Capacitor configuration
│   ├── package.json             # Mobile dependencies
│   ├── tsconfig.json            # TypeScript config
│   └── .gitignore
│
├── docs/                         (DOCUMENTATION)
│   ├── ARCHITECTURE.md           # This file
│   ├── MOBILE_SETUP.md          # Mobile setup guide
│   └── APP_STORE_GUIDE.md       # Publishing guide
│
├── RELEASE_NOTES_v1.1.md        (Release notes)
├── README.md                     (Main readme)
├── STABLE_VERSION.md             (v1.0 docs)
└── .gitignore
```

---

## 🔄 Code Sharing Strategy

### What's in `shared/`?

| File | Purpose | Used By |
|------|---------|---------|
| `types.ts` | TypeScript interfaces & types | web, mobile |
| `firebaseConfig.ts` | Firebase credentials | web, mobile |
| `wordPrioritization.ts` | Word selection algorithm | web, mobile |
| `utils.ts` | Helper functions | web, mobile |

### What's NOT Shared?

| Component | Location | Reason |
|-----------|----------|--------|
| UI Components | `web/`, `mobile/src/components/` | Different frameworks (HTML vs React) |
| Pages/Screens | `web/` (divs), `mobile/src/pages/` | Different UX patterns |
| Styling | `web/styles.css`, `mobile/src/App.css` | CSS vs styled-components/Tailwind |

---

## 🚀 Development Workflow

### Scenario 1: Fix Bug in Algorithm

**File:** `shared/wordPrioritization.ts`

```bash
# Both web and mobile automatically use the fix
web/script.js → imports from shared
mobile/src/ → imports from shared

# Just commit once
git add shared/wordPrioritization.ts
git commit -m "Fix word priority calculation"
git push
```

### Scenario 2: Update Firebase Logic

**File:** `shared/firebaseConfig.ts` or `shared/utils.ts`

```bash
# Update shared code
shared/utils.ts → calculateAnalytics()

# Both web and mobile use it
# Deploy separately:
# - Web: git push → GitHub Pages (1 min)
# - Mobile: rebuild → App Store (3-5 days)
```

### Scenario 3: Add Feature to Web Only

**File:** `web/script.js` and `web/styles.css`

```bash
# No change to mobile
git add web/
git commit -m "Add leaderboard to web"
git push

# Mobile stays unchanged
# Can update mobile later with same feature
```

### Scenario 4: Add Feature to Both

**Example:** Add new analytics metric

```bash
# 1. Update shared calculation
shared/utils.ts → calculateAnalytics()

# 2. Update web UI
web/index.html
web/styles.css

# 3. Update mobile UI
mobile/src/pages/Analytics.tsx
mobile/src/App.css

# 4. Commit everything
git add shared/ web/ mobile/
git commit -m "Feature: Add new analytics metric to both platforms"
git push
```

---

## 📦 Dependency Management

### Web Versions
- **Current:** `web/` uses inline Firebase SDK
- **Option:** Can add `package.json` if you want npm management

### Mobile Versions
- **React:** Latest stable
- **Firebase:** Official React SDK
- **Capacitor:** Latest for iOS integration

### Shared Module
- **TypeScript:** Shared types only
- **No framework dependency:** Pure TypeScript/JavaScript

---

## 🔗 Import Examples

### In `web/script.js`
```javascript
// Currently uses inline code
// Option to import from shared later:
import { getPrioritizedWords } from '../shared';
```

### In `mobile/src/pages/Home.tsx`
```typescript
import { getPrioritizedWords, calculateAnalytics } from '../../shared';
import { Word, SpellingLog } from '../../shared/types';

export function Home() {
  const words = getPrioritizedWords(allWords, logs, 'One Bee');
  // ...
}
```

---

## 🌳 Git Branches (Optional)

You can use branches for different work:

```bash
# Main branch (always stable)
main/
├── web/ (latest working version)
├── mobile/ (latest working version)
└── shared/ (latest working version)

# Feature branches
feature/add-spaced-repetition
feature/dark-mode
feature/leaderboard

# Release branches
release/v1.2
release/v2.0
```

---

## 🔄 Version Synchronization

### Web (`main` branch)
- Deploy on push → Live in 1 minute
- Update anytime (no review process)

### Mobile (`main` branch)
- Deploy manually → Apple review 1-3 days
- Release on your schedule

### Keep Both Updated
```bash
# After any shared code change
cd web
# Rebuild if needed

cd ../mobile
npm run build
npx cap sync

# Both should work
```

---

## 📋 Deployment Matrix

| Action | Command | Time | Platform |
|--------|---------|------|----------|
| Update Web | `git push` | 1 min | GitHub Pages |
| Update Mobile | `npx cap sync` + submit | 3-5 days | App Store |
| Update Shared | `git push` + sync both | 1 min + rebuild | Both |

---

## ✅ Checklist for Each Release

- [ ] Test changes locally
- [ ] Update shared code if needed
- [ ] Commit everything
- [ ] Push to main
- [ ] Deploy web (automatic)
- [ ] Rebuild mobile if needed
- [ ] Test on simulator
- [ ] Submit to App Store (if changes)
- [ ] Update version number
- [ ] Create release tag

---

## 🎯 Next Phase

After mobile setup is complete:

1. **Create shared/ ✅** (done)
2. **Create mobile/ structure** (next)
3. **Build mobile UI** (after that)
4. **Test on simulator** (testing phase)
5. **Configure App Store** (before publishing)
6. **Submit and publish** (final)

---

**Ready to proceed with mobile initialization?** 

Run the commands in [MOBILE_SETUP.md](MOBILE_SETUP.md) and reply when done! ✅
