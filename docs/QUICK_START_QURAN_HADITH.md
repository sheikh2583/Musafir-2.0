# 🚀 Quick Start Guide - Quran & Hadith Feature

## Overview
This guide will help you set up the Quran and Hadith features in your Islamic app.

---

## Prerequisites

✅ Node.js installed  
✅ MongoDB Atlas or local MongoDB running  
✅ Backend server configured  
✅ React Native/Expo environment set up

---

## Step-by-Step Setup

### 1️⃣ Install Dependencies

```bash
# Backend
cd backend
npm install axios

# Frontend (if not already installed)
cd mobile-app
npm install axios @react-native-async-storage/async-storage
```

### 2️⃣ Download Data (RECOMMENDED METHOD)

**For Quran:**
1. Download complete Quran JSON from: https://github.com/risan/quran-json
2. Create folder: `backend/data/`
3. Save as: `backend/data/quran.json`

**For Hadith:**
1. Download Sihah Sittah JSON from: https://github.com/A-H4NU/kalem-data
2. Create folder: `backend/data/hadith/`
3. Save each collection:
   - `backend/data/hadith/bukhari.json`
   - `backend/data/hadith/muslim.json`
   - `backend/data/hadith/abudawud.json`
   - `backend/data/hadith/tirmidhi.json`
   - `backend/data/hadith/nasai.json`
   - `backend/data/hadith/ibnmajah.json`

### 3️⃣ Run Import Scripts

```bash
cd backend

# Import Quran (one time only)
node scripts/importQuran.js

# Import Hadith (one time only)
node scripts/importHadith.js
```

**Expected Output:**
```
✅ Connected to MongoDB
📚 Importing surah metadata...
✅ Successfully imported metadata for 114 surahs
📖 Importing Quran from local JSON file...
✅ Successfully imported 6236 ayahs from JSON

📊 Import Summary:
   Total Ayahs: 6236 / 6236 expected
   Total Surahs: 114 / 114 expected
✅ Import complete and verified!
```

### 4️⃣ Start the Backend

```bash
cd backend
npm start
```

Server should start on `http://localhost:5000`

### 5️⃣ Test API Endpoints

```bash
# Test Quran
curl http://localhost:5000/api/quran/stats

# Test Hadith
curl http://localhost:5000/api/hadith/collections

# Test specific surah
curl http://localhost:5000/api/quran/surah/1
```

### 6️⃣ Update Frontend API URL

Edit `mobile-app/src/services/api.js`:

```javascript
// Update this line with your backend IP/URL
const API_URL = 'http://YOUR_IP:5000/api';
```

**Finding your IP:**
- Windows: `ipconfig` (look for IPv4)
- Mac/Linux: `ifconfig` or `ip addr`

### 7️⃣ Start the Mobile App

```bash
cd mobile-app
npm start
# or
expo start
```

### 8️⃣ Navigate to Quran/Hadith

In the app:
1. Login/Register
2. Tap **Quran** tab (book icon)
3. Tap **Hadith** tab (library icon)
4. Browse and enjoy!

---

## Alternative: API Import (No JSON Files)

If you don't want to download JSON files:

### Quran API Import
```bash
# Uses quran.com API
cd backend
node scripts/importQuran.js
# Takes ~10-15 minutes
```

### Hadith API Import
```bash
# Requires sunnah.com API key (optional)
# Add to .env: SUNNAH_API_KEY=your_key_here
cd backend
node scripts/importHadith.js
# Takes ~30-60 minutes
```

⚠️ **Note:** API import is slower and requires stable internet. JSON method is recommended.

---

## Verification Checklist

After setup, verify:

- [ ] Backend starts without errors
- [ ] MongoDB has `quran`, `surah_metadata`, and `hadith` collections
- [ ] `/api/quran/stats` returns `isComplete: true`
- [ ] `/api/hadith/collections` returns 6 collections
- [ ] Mobile app shows Quran tab with 114 surahs
- [ ] Mobile app shows Hadith tab with 6 collections
- [ ] Can read Surah Al-Fatiha (Surah 1)
- [ ] Can browse Sahih Bukhari hadiths
- [ ] Arabic text displays correctly (RTL)
- [ ] Translations appear when toggled

---

## Common Issues & Solutions

### ❌ "Failed to load Quran"
**Cause:** Backend not running or wrong API URL  
**Fix:** 
1. Check backend is running
2. Verify API_URL in `api.js`
3. Check firewall/network

### ❌ "Import failed: ENOENT"
**Cause:** JSON files not found  
**Fix:** 
1. Verify file paths match exactly
2. Create `backend/data/` folder
3. Download JSON files again

### ❌ Arabic text shows as boxes
**Cause:** Font doesn't support Arabic  
**Fix:** 
- Android: Usually works by default
- iOS: Should work by default
- Ensure latest Expo version

### ❌ "Database not complete"
**Cause:** Import didn't finish  
**Fix:**
1. Check import script logs
2. Re-run import script
3. Check MongoDB connection

### ❌ Slow scrolling in Surah view
**Cause:** Performance issue  
**Fix:**
- Already optimized with FlatList
- Reduce `initialNumToRender` if needed
- Test on physical device (faster than simulator)

---

## File Structure Created

```
backend/
├── models/
│   ├── Quran.model.js          ✅ Created
│   ├── Hadith.model.js          ✅ Created
│   └── SurahMetadata.model.js   ✅ Created
├── controllers/
│   ├── quran.controller.js      ✅ Created
│   └── hadith.controller.js     ✅ Created
├── routes/
│   ├── quran.routes.js          ✅ Created
│   └── hadith.routes.js         ✅ Created
├── scripts/
│   ├── importQuran.js           ✅ Created
│   └── importHadith.js          ✅ Created
├── data/                        📁 Create manually
│   ├── quran.json              📥 Download
│   └── hadith/                 📁 Create manually
│       ├── bukhari.json        📥 Download
│       ├── muslim.json         📥 Download
│       ├── abudawud.json       📥 Download
│       ├── tirmidhi.json       📥 Download
│       ├── nasai.json          📥 Download
│       └── ibnmajah.json       📥 Download
└── server.js                    ✅ Updated

mobile-app/
├── src/
│   ├── screens/
│   │   ├── QuranScreen.js       ✅ Created
│   │   ├── SurahScreen.js       ✅ Created
│   │   ├── HadithScreen.js      ✅ Created
│   │   └── HadithCollectionScreen.js ✅ Created
│   ├── services/
│   │   ├── quranService.js      ✅ Created
│   │   └── hadithService.js     ✅ Created
│   └── navigation/
│       └── AppNavigator.js      ✅ Updated
```

---

## Next Steps

1. **Test thoroughly** on both iOS and Android
2. **Import data** from trusted sources
3. **Customize colors** in screens if desired
4. **Add analytics** (optional) to track usage
5. **Plan future features** (bookmarks, search, etc.)

---

## Resources

- 📖 Full Documentation: `docs/QURAN_HADITH_IMPLEMENTATION.md`
- 🌐 Quran JSON: https://github.com/risan/quran-json
- 📚 Hadith JSON: https://github.com/A-H4NU/kalem-data
- 🔍 Alternative Quran: https://github.com/islamic-network/quran.json
- 📖 Quran.com API: https://api.quran.com/api/v4/
- 📚 Sunnah.com API: https://sunnah.api-docs.io/

---

## Support

For issues or questions:
1. Check `docs/QURAN_HADITH_IMPLEMENTATION.md`
2. Review error messages in console
3. Verify all files were created
4. Check MongoDB connection

---

**May Allah bless this project and make it beneficial for the Ummah! 🤲**
