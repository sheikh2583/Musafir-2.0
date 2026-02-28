# Data Directory

This directory contains JSON files for importing Quran and Hadith data into the database.

## 📁 Structure

```
data/
├── quran.json           # Complete Quran (6,236 ayahs)
├── hadith/              # Hadith collections folder
│   ├── bukhari.json     # Sahih Bukhari
│   ├── muslim.json      # Sahih Muslim
│   ├── abudawud.json    # Sunan Abu Dawood
│   ├── tirmidhi.json    # Jami` at-Tirmidhi
│   ├── nasai.json       # Sunan an-Nasa'i
│   └── ibnmajah.json    # Sunan Ibn Majah
└── README.md            # This file
```

## 📥 Download Data Sources

### Quran Data

**Option 1: Risan's Quran JSON (Recommended)**
- Repository: https://github.com/risan/quran-json
- Download: Complete JSON with Uthmani text and translations
- Save as: `data/quran.json`

**Option 2: Islamic Network**
- Repository: https://github.com/islamic-network/quran.json
- Multiple translation options available

**Option 3: Tanzil Project**
- Website: http://tanzil.net/download/
- Format: XML (requires conversion to JSON)

### Hadith Data

**Option 1: Kalem Data (Recommended)**
- Repository: https://github.com/A-H4NU/kalem-data
- Includes: All Sihah Sittah with English translations
- Save each collection in: `data/hadith/`

**Option 2: Islamic Network Hadith API**
- Repository: https://github.com/islamic-network/hadith-api-data
- Format: SQL dumps (requires processing)

**Option 3: Sunnah.com API**
- Can be downloaded via API using import scripts
- Requires API key (optional)

## 🔄 Import Process

After downloading JSON files:

```bash
# Import Quran
cd backend
node scripts/importQuran.js

# Import Hadith
node scripts/importHadith.js
```

The scripts will automatically detect JSON files in this directory and import them.

## ✅ Verification

After import, verify data integrity:

```bash
# Check counts
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Quran = require('./models/Quran.model');
  const Hadith = require('./models/Hadith.model');
  const qCount = await Quran.countDocuments();
  const hCount = await Hadith.countDocuments();
  console.log('Quran ayahs:', qCount, '/ 6236 expected');
  console.log('Hadith total:', hCount);
  process.exit(0);
});
"
```

## 📝 Expected JSON Formats

### Quran JSON Structure
```json
[
  {
    "surah": 1,
    "ayah": 1,
    "text": "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
    "translation_en": "In the name of Allah...",
    "translation_bn": "",
    "juz": 1,
    "page": 1,
    "manzil": 1
  }
]
```

### Hadith JSON Structure
```json
[
  {
    "hadithNumber": 1,
    "bookNumber": 1,
    "bookName": "Revelation",
    "chapter": "How the Divine Inspiration started",
    "arabicText": "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
    "translationEn": "Actions are but by intentions...",
    "narrator": "Umar ibn Al-Khattab",
    "grade": "Sahih"
  }
]
```

**Note:** Actual structure may vary by source. Import scripts handle common formats.

## ⚠️ Important Notes

1. **Data Integrity**: Only use trusted Islamic sources
2. **Arabic Encoding**: Ensure UTF-8 encoding for proper Arabic display
3. **File Size**: Hadith files can be large (10-50MB each)
4. **Verification**: Always verify data with authentic sources
5. **Backup**: Keep original files as backup

## 🔒 Gitignore

These JSON files are in `.gitignore` to avoid:
- Large files in repository
- Potential copyright issues
- Storage overhead

Users should download their own copies from official sources.

## 📚 Alternative: API Import

If you don't have JSON files, the import scripts can fetch data from APIs:

```bash
# Quran from quran.com API
node scripts/importQuran.js

# Hadith from sunnah.com API (requires API key)
SUNNAH_API_KEY=your_key node scripts/importHadith.js
```

⚠️ API import is slower and requires internet connection.

## 📖 Resources

- Quran.com: https://quran.com
- Sunnah.com: https://sunnah.com
- IslamicNetwork: https://islamic.network
- Tanzil: http://tanzil.net
- Kalem Project: https://github.com/A-H4NU

---

**Download authentic Islamic data from trusted sources only.**
