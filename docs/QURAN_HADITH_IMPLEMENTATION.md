# Quran & Hadith Feature Implementation

## 📋 Overview

This document outlines the complete implementation of offline-first Quran and Hadith features for the Islamic application. All religious text is stored locally in MongoDB and served without external API dependencies after initial setup.

---

## 🗄️ Database Architecture

### Quran Schema (`Quran.model.js`)
- **Purpose**: Stores all 6,236 ayahs of the Quran
- **Key Fields**:
  - `surah`: Number (1-114) - indexed
  - `ayah`: Number - indexed
  - `arabicText`: Uthmani script (required)
  - `translationEn`: English translation
  - `translationBn`: Bangla translation
  - `metadata`: { juz, page, manzil, ruku, hizbQuarter, sajda }
- **Indexes**:
  - Compound: `{ surah: 1, ayah: 1 }` (unique)
  - Single: `{ 'metadata.juz': 1 }`
  - Single: `{ 'metadata.page': 1 }`

### SurahMetadata Schema (`SurahMetadata.model.js`)
- **Purpose**: Metadata for all 114 surahs
- **Key Fields**:
  - `surahNumber`: 1-114 (unique, indexed)
  - `nameArabic`, `nameTransliteration`, `nameTranslation`
  - `revelationType`: Meccan/Medinan
  - `ayahCount`, `revelationOrder`

### Hadith Schema (`Hadith.model.js`)
- **Purpose**: Stores Sihah Sittah (6 authentic hadith collections)
- **Collections**: bukhari, muslim, abudawud, tirmidhi, nasai, ibnmajah
- **Key Fields**:
  - `collection`: Collection ID (indexed)
  - `hadithNumber`: Hadith number (indexed)
  - `bookNumber`, `bookName`, `chapter`, `chapterNumber`
  - `arabicText`: Arabic text (required)
  - `translationEn`: English translation
  - `translationBn`: Bangla translation
  - `metadata`: { narrator, grade, reference }
- **Indexes**:
  - Compound: `{ collection: 1, hadithNumber: 1 }` (unique)
  - Compound: `{ collection: 1, bookNumber: 1 }`

---

## 🔌 Backend API Endpoints

### Quran Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quran/surahs` | Get all surah metadata |
| GET | `/api/quran/surah/:surahNumber/metadata` | Get specific surah metadata |
| GET | `/api/quran/surah/:surahNumber` | Get all ayahs for a surah |
| GET | `/api/quran/ayah/:surahNumber/:ayahNumber` | Get specific ayah |
| GET | `/api/quran/juz/:juzNumber` | Get ayahs by juz (1-30) |
| GET | `/api/quran/page/:pageNumber` | Get ayahs by page (1-604) |
| GET | `/api/quran/stats` | Get database statistics |

### Hadith Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hadith/collections` | Get all collections with counts |
| GET | `/api/hadith/:collection` | Get hadiths from collection (paginated) |
| GET | `/api/hadith/:collection/:hadithNumber` | Get specific hadith |
| GET | `/api/hadith/:collection/books` | Get books/chapters structure |
| GET | `/api/hadith/stats/all` | Get database statistics |

---

## 📱 Frontend Screens

### Quran Screens

#### QuranScreen.js
- **Purpose**: Browse all 114 surahs
- **Features**:
  - Search functionality
  - Surah cards with Arabic name, transliteration, translation
  - Metadata display (Meccan/Medinan, ayah count)
  - Virtualized FlatList for performance

#### SurahScreen.js
- **Purpose**: Read ayahs from a specific surah
- **Features**:
  - RTL Arabic text rendering
  - Translation toggle (show/hide)
  - Language toggle (English/Bangla)
  - Bismillah display (except Surah 9)
  - Sajda indicators
  - Juz/Page metadata
  - Virtualized list with proper Arabic font sizing

### Hadith Screens

#### HadithScreen.js
- **Purpose**: Browse Sihah Sittah collections
- **Features**:
  - Color-coded collection cards
  - Collection metadata (compiler, hadith count)
  - Beautiful, respectful UI

#### HadithCollectionScreen.js
- **Purpose**: Browse hadiths from a specific collection
- **Features**:
  - Paginated hadith list
  - Arabic text with RTL support
  - English translation
  - Narrator chain display
  - Authenticity grade badges
  - Load more functionality
  - Book/chapter information

---

## 📦 Data Import Scripts

### importQuran.js

**Purpose**: One-time import of complete Quran

**Data Sources**:
1. **API Method**: quran.com API (fallback)
2. **JSON Method**: Pre-downloaded JSON files (recommended)

**Recommended JSON Sources**:
- https://github.com/risan/quran-json
- https://github.com/islamic-network/quran.json

**Usage**:
```bash
# Option 1: Import from JSON (recommended)
# 1. Download quran.json to backend/data/quran.json
# 2. Run import
cd backend
node scripts/importQuran.js

# Option 2: Import from API (requires internet)
node scripts/importQuran.js
```

**Expected Results**:
- 6,236 ayahs imported
- 114 surah metadata entries
- Proper indexing created

### importHadith.js

**Purpose**: One-time import of Sihah Sittah

**Data Sources**:
1. **API Method**: sunnah.com API (fallback)
2. **JSON Method**: Pre-downloaded JSON files (recommended)

**Recommended JSON Sources**:
- https://github.com/A-H4NU/kalem-data
- https://github.com/islamic-network/hadith-api-data

**Usage**:
```bash
# Option 1: Import from JSON files (recommended)
# 1. Download collection JSON files to backend/data/hadith/
#    - bukhari.json
#    - muslim.json
#    - abudawud.json
#    - tirmidhi.json
#    - nasai.json
#    - ibnmajah.json
# 2. Run import
cd backend
node scripts/importHadith.js

# Option 2: Import from API (requires API key)
# Set SUNNAH_API_KEY in .env
node scripts/importHadith.js
```

---

## 🚀 Setup Instructions

### Step 1: Backend Setup

1. **Ensure MongoDB is running**
```bash
# MongoDB connection string should be in .env
MONGODB_URI=mongodb+srv://your-connection-string
```

2. **Install dependencies** (if not already done)
```bash
cd backend
npm install mongoose axios dotenv
```

3. **Run data imports**
```bash
# Import Quran (choose one method)
node scripts/importQuran.js

# Import Hadith (choose one method)
node scripts/importHadith.js
```

4. **Verify imports**
```bash
# Start server
npm start

# Test endpoints
curl http://localhost:5000/api/quran/stats
curl http://localhost:5000/api/hadith/stats/all
```

### Step 2: Frontend Setup

1. **Install dependencies** (if needed)
```bash
cd mobile-app
npm install axios @react-native-async-storage/async-storage
```

2. **Update API URL** (if needed)
Edit `mobile-app/src/services/api.js` to match your backend URL.

3. **Run the app**
```bash
npm start
# or
expo start
```

---

## ✅ Integration Checklist

- [x] Mongoose schemas created with proper indexing
- [x] Backend controllers with error handling
- [x] Backend routes registered in server.js
- [x] Data import scripts (API + JSON methods)
- [x] Frontend services for API calls
- [x] Quran screens with RTL support
- [x] Hadith screens with pagination
- [x] Navigation updated with new tabs
- [x] No breaking changes to existing code

---

## 🎨 Design Decisions

### Why Offline-First?
- **Religious Accuracy**: Control over data sources
- **Performance**: No network latency
- **Reliability**: Works without internet
- **Privacy**: No tracking of religious reading

### Why MongoDB?
- **Flexible Schema**: Easy to add metadata
- **Powerful Indexing**: Fast queries
- **Aggregation**: Complex queries for future features
- **Scalability**: Room to grow

### Why Virtualized Lists?
- **Performance**: Smooth scrolling with thousands of items
- **Memory Efficient**: Only renders visible items
- **Better UX**: No lag when browsing

### Why Separate Metadata?
- **Efficiency**: Don't load all ayahs to get surah info
- **Cleaner API**: Separate concerns
- **Better Caching**: Can cache metadata separately

---

## 🔮 Future Enhancement Ideas

### Phase 1: Search
- Full-text search across Quran
- Search by root words (Arabic)
- Hadith search by topic/keyword

### Phase 2: Bookmarks & Notes
- Save favorite ayahs
- Personal notes on ayahs/hadiths
- Reading history

### Phase 3: Audio
- Ayah recitation by multiple qaris
- Download for offline listening
- Sync with text highlighting

### Phase 4: Tafsir (Interpretation)
- Add tafsir collections
- Link to relevant hadiths
- Scholar commentary

### Phase 5: AI/Semantic Search
- Semantic similarity search
- Topic extraction
- Cross-reference finder
- Theme-based browsing

### Phase 6: Learning Features
- Memorization tracker
- Daily ayah notifications
- Quiz mode
- Tajweed rules

---

## 📊 Performance Considerations

### Backend
- **Indexes**: All critical fields indexed
- **Pagination**: Hadith endpoints use pagination
- **Lean Queries**: Using `.lean()` for read-only data
- **Selective Fields**: Only fetch needed fields

### Frontend
- **FlatList**: Virtualization enabled
- **Initial Render**: Limited to 10-20 items
- **Window Size**: Optimized for smooth scrolling
- **Memoization**: Components memoized where beneficial

---

## 🔒 Data Integrity

### Critical Rules
1. **Never modify Arabic text** without verification from scholars
2. **Source verification** - All data from trusted Islamic sources
3. **Immutable data** - Religious text should not be user-editable
4. **Backup regularly** - Religious data is irreplaceable
5. **Version control** - Track any changes to data sources

### Recommended Data Sources
- **Quran**: Tanzil.net, Quran.com, IslamicNetwork
- **Hadith**: Sunnah.com, IslamicNetwork, Kalem Project
- **Verify with**: Physical mushaf, authentic publications

---

## 🐛 Troubleshooting

### Import Issues
**Problem**: Import script fails
**Solution**: 
- Check MongoDB connection
- Verify JSON file paths
- Check file format matches expected structure

### Missing Data
**Problem**: Some surahs/hadiths not appearing
**Solution**:
- Check import logs
- Verify database counts
- Re-run import script

### RTL Display Issues
**Problem**: Arabic text not right-aligned
**Solution**:
- Ensure `writingDirection: 'rtl'` in styles
- Check `textAlign: 'right'`
- Verify font supports Arabic

### Performance Issues
**Problem**: Slow scrolling
**Solution**:
- Verify virtualization enabled
- Check `initialNumToRender` is small (10-20)
- Use `removeClippedSubviews` on Android

---

## 📚 API Response Examples

### Quran Surah Response
```json
{
  "success": true,
  "surah": 1,
  "count": 7,
  "data": [
    {
      "surah": 1,
      "ayah": 1,
      "arabicText": "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
      "translationEn": "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
      "translationBn": "",
      "metadata": {
        "juz": 1,
        "page": 1,
        "sajda": false
      }
    }
  ]
}
```

### Hadith Response
```json
{
  "success": true,
  "collection": "bukhari",
  "data": {
    "collection": "bukhari",
    "hadithNumber": 1,
    "bookNumber": 1,
    "bookName": "Revelation",
    "arabicText": "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
    "translationEn": "Actions are but by intentions...",
    "metadata": {
      "narrator": "Umar ibn Al-Khattab",
      "grade": "Sahih",
      "reference": "Sahih Bukhari 1"
    }
  }
}
```

---

## 📝 Notes for Future Developers

1. **Religious Accuracy First**: When in doubt, consult Islamic scholars
2. **Test Thoroughly**: Religious app bugs affect worship - test extensively
3. **Respect the Content**: This is sacred text - handle with care
4. **Document Changes**: Any data source changes must be documented
5. **Performance Matters**: Slow Quran reading is frustrating
6. **Accessibility**: Consider users with visual impairments
7. **Offline is Critical**: Must work without internet

---

## 🙏 Credits

- **Quran Data**: Quran.com, Tanzil.net
- **Hadith Data**: Sunnah.com, IslamicNetwork
- **Arabic Fonts**: System fonts with Arabic support
- **Guidance**: Islamic scholars and community feedback

---

**Built with respect for Islamic knowledge and tradition.**
