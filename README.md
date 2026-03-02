<div align="center">

# بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ

# ✦ Musafir ✦

### *Your faithful companion on the journey to Allah*

**Quran** · **Hadith** · **AI Chat** · **Prayer Tracking** · **Dua & Adhkar** · **Islamic Lectures** · **Zakat** · **Hijri Calendar** · **Qibla** · **Arabic Writing** · **Travel Mode** · **Community**

<br>

![Expo SDK](https://img.shields.io/badge/Expo_SDK-54-4630EB?style=for-the-badge&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-0.3-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-llama3.2-FF6F00?style=for-the-badge)

</div>

---

> *"Indeed, this Quran guides to that which is most suitable."* — Al-Isra 17:9

**Musafir** (مسافر — *traveler*) is an offline-first Islamic super-app that puts the entire Muslim spiritual toolkit in your pocket. From AI-powered Quran & Hadith search trained on classical scholarly texts, GPS-based prayer tools with Hanafi jurisprudence, to a community leaderboard where friends hold each other accountable — Musafir is built for the modern Muslim who refuses to compromise on tradition.

34 screens. 16 services. Zero ads. Pure worship.

---

## ✦ Table of Contents

- [Core Worship](#-core-worship)
- [Knowledge & Learning](#-knowledge--learning)
- [Tools & Lifestyle](#-tools--lifestyle)
- [Community](#-community)
- [Architecture](#-architecture)
- [Navigation Map](#-navigation-map)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Folder Structure](#-folder-structure)
- [AI Knowledge Base](#-ai-knowledge-base)
- [Gitignored Assets](#-gitignored-assets)
- [Bug Report](#-bug-report)
- [Contributing](#-contributing)

---

## 🕌 Core Worship

### 📖 Quran
The complete Quran with **114 surahs** in Arabic script, English translation, and full **Tajweed** color-coded rules. Three translation languages (Arabic, English, Indonesian). **Semantic vector search** powered by BGE ONNX embeddings finds verses by *meaning*, not just keywords — ask "verses about patience" and get every relevant ayah ranked by relevance.

### 📚 Hadith — The Six Canonical Collections
All **6 major hadith books** at your fingertips:
- **Sahih Bukhari** · **Sahih Muslim** · **Sunan Abu Dawud**
- **Jami at-Tirmidhi** · **Sunan an-Nasai** · **Sunan Ibn Majah**

Each collection features full-text browsing and **semantic search** — the same two-stage RAG pipeline (BGE embedder → ChromaDB HNSW → BGE Reranker cross-check) that powers Quran search, delivering the top 7 most relevant hadith in ~2–3 seconds.

### 🕋 Prayer Tracking (Salat)
Log all **5 daily prayers** with a single tap. Track **streaks**, view weekly stats, and never miss Fajr again. Includes **Hanafi forbidden prayer times** — 3 *haram* and 2 *makruh tahrimi* windows calculated from solar position. A real-time **waqt countdown timer** on the home screen always shows the current and next prayer with time remaining.

### 🤲 Dua & Adhkar
**72+ duas** organized across **11 categories** — morning/evening adhkar, before sleep, entering the mosque, travel, rain, and more. Each dua includes the **Arabic text**, **transliteration**, and **English translation**. Mark favorites, track your recitation count, and search across the entire collection.

---

## 🎓 Knowledge & Learning

### 🤖 ILM — AI Islamic Chat
The crown jewel. **ILM** (عِلْم — *knowledge*) is an AI chatbot trained on classical Islamic scholarship through a **RAG pipeline**: LangChain orchestrates Ollama's **llama3.2** LLM with **ChromaDB** vector retrieval over curated texts. Ask any Islamic question and receive sourced answers grounded in authentic scholarship — not generic internet responses.

The animated **ILM orb** on the home screen pulses with a golden glow, always one tap away.

### 🎓 Quran Quiz
**119 quiz files** — one vocabulary quiz per surah plus dedicated tafsir quizzes. Choose between vocabulary mode (test Arabic word meanings) and tafsir mode (test comprehension). Stats tracking with a persistent dictionary of **Quranic vocabulary** for self-study.

### ✍️ Arabic Writing
Swipe-to-write Arabic letters on a touch canvas. An **AraCLIP ML model** (with CLIP fallback) scores your handwriting in real-time, helping you perfect your Arabic letterforms through practice and instant feedback.

### 🎧 Islamic Lectures
**900+ lectures** from **9 renowned speakers**, streamed directly from the **Internet Archive**. Features streaming playback with **speed control** (0.5×–2×), a **floating mini-player** that persists across all screens, favorites, recently played, and speaker-based browsing. Zero runtime API calls — all metadata is pre-bundled.

---

## 🧰 Tools & Lifestyle

### 🧭 Qibla Compass
Uses the device **magnetometer** (expo-sensors) to point you toward the Ka'bah from anywhere in the world. No internet required — pure on-device compass bearing calculation.

### 🕋 Nearby Mosques
Finds mosques around your location using the **OpenStreetMap Overpass API** — completely free, no API key required. Shows distance calculated with the **Haversine formula** and opens directions in your maps app.

### 🧮 Zakat Calculator
Hanafi-compliant zakat calculation with **live gold & silver prices** (BDT). Supports cash, gold (Nisab: 87.48g), silver (Nisab: 612.36g), stocks, and business assets. Calculates your 2.5% zakat obligation and links directly to donation portals (bKash, Nagad, and more).

### 📅 Hijri Calendar & Ramadan
Full Islamic calendar powered by the **Aladhan API** with event markers for all major Islamic dates (complete with Arabic names, emojis, and Quran references). During Ramadan, displays **GPS-based Sehri & Iftar times** with a beautiful **live countdown timer** — tap to toggle between Iftar countdown (during fasting hours) and Sehri countdown (after Iftar).

### 🧳 Musafir — Travel & Qasr Mode
The app's namesake feature. **GPS-based travel detection** automatically identifies when you've traveled beyond **77.25 km (48 miles)** — the Hanafi threshold — and enables **Qasr prayer shortening** (Zuhr, Asr, Isha: 4 → 2 rakats). Tracks distance, duration, and maximum stay of **15 days**. All prayer times calculated from **solar position** — no external API dependency.

### 🔔 Push Notifications
**Azan alerts** for all 5 daily prayers with audio playback (expo-av). **Hadith of the Day** notifications. Islamic event reminders. Graceful degradation in Expo Go via dynamic module loading.

---

## 👥 Community

### Social Hub
A **Global** and **Friends** feed for sharing Islamic content and reflections. **Befriend** other users (not "follow" — befriend, because this is an ummah). Search for users and view profiles.

### Friends-Only Salat Leaderboard
A **weekly prayer leaderboard** that only shows your friends + yourself. Compete with your circle on who can maintain the longest prayer streak. Accountability through brotherhood.

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  📱 Mobile App (Expo SDK 54 / React Native 0.81 / React 19)     │
│  ├── 34 Screens across 5 tab stacks                             │
│  ├── 16 Service Modules (offline-capable)                       │
│  ├── 3 Context Providers (Auth, Audio, Settings)                │
│  ├── Offline-first Quran data (bundled JSON)                    │
│  ├── FloatingMiniPlayer (persistent audio overlay)              │
│  └── Dark theme (#121212 bg / #D4A84B gold accent)              │
└─────────────────────┬────────────────────────────────────────────┘
                      │ HTTP (Axios)
┌─────────────────────▼────────────────────────────────────────────┐
│  🖥 Backend API (Express 5 / Mongoose 9)    Port 5000            │
│  ├── /api/auth       — JWT authentication (bcrypt + 30d tokens) │
│  ├── /api/users      — User CRUD, befriend (subscriptions)      │
│  ├── /api/quran      — 114 surahs + ONNX semantic search        │
│  ├── /api/hadith     — 6 collections + semantic search           │
│  ├── /api/quiz       — Vocabulary + tafsir quizzes               │
│  ├── /api/salat      — Prayer logging, streaks, leaderboard     │
│  ├── /api/messages   — Community posts                           │
│  └── /api/chat ──────┐ Proxy to AI service                      │
│                      │                                           │
│  ML Search Module:   │                                           │
│  BGE-base-en-v1.5 (768-dim) → ChromaDB HNSW → BGE Reranker     │
└──────────────────────┼───────────────────────────────────────────┘
                       │ HTTP (axios → Flask)
┌──────────────────────▼───────────────────────────────────────────┐
│  🧠 AI Chat Service (Flask + LangChain)     Port 5001            │
│  ├── Ollama llama3.2 (LLM generation)                            │
│  ├── nomic-embed-text (embedding model)                          │
│  ├── ChromaDB (vector store — 7 Islamic texts ingested)          │
│  └── Two-stage RAG: retrieve → rerank → generate                │
└──────────────────────────────────────────────────────────────────┘
         ┌──────────────────────────────────────┐
         │  🔬 ML Scoring Service (FastAPI)      │
         │  AraCLIP model for Arabic handwriting │
         │  Fallback: OpenAI CLIP               │
         └──────────────────────────────────────┘
```

---

## 🗺 Navigation Map

Authentication: **Welcome → Login → Register**

Once authenticated, the app presents **5 bottom tabs** with gold (#D4A84B) active indicator:

| Tab | Icon | Screens | Key Destinations |
|-----|------|---------|-----------------|
| **🏠 Home** | `home` | 16 | Dashboard, AI Chat, Qibla, Mosques, Zakat, Dua (Category → SubCategory → Detail → Favorites), Lectures (Speakers → List → Player), Musafir Status, Calendar, Leaderboard, User Profiles |
| **📖 Quran** | `book` | 8 | Surah List, Surah Reader, Quiz Mode, Ayah Range Select, Verse Search, Arabic Writing, Quran Quiz |
| **📚 Hadith** | `library` | 3 | Collection Browser, Book View, Search Results |
| **👥 Community** | `people` | 3 | Social Feed (Global/Friends), User Profiles, Leaderboard |
| **👤 Profile** | `person` | 2 | Profile Dashboard, Settings |

> A **FloatingMiniPlayer** overlay persists above all tabs when audio is playing.

---

## ⚙️ Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Mobile** | React Native | 0.81.5 | Cross-platform UI |
| | Expo SDK | 54 | Native module management |
| | React | 19.1.0 | Component framework |
| **Backend** | Express | 5.2 | REST API framework |
| | Mongoose | 9.0 | MongoDB ODM |
| | ONNX Runtime | 1.23 | On-server ML inference |
| | Helmet + CORS | latest | Security headers |
| **AI Service** | LangChain | 0.3.14 | RAG orchestration |
| | Ollama | — | Local LLM hosting |
| | ChromaDB | 0.5+ | Vector store |
| | Flask | 3.0+ | HTTP API layer |
| **ML Models** | BGE-base-en-v1.5 | — | 768-dim text embeddings |
| | BGE Reranker | — | Cross-encoder reranking |
| | AraCLIP | — | Arabic handwriting scoring |
| **Database** | MongoDB Atlas | — | Cloud document store |
| **External APIs** | Aladhan | — | Hijri calendar + prayer times |
| | OpenStreetMap Overpass | — | Mosque geolocation (free) |
| | Internet Archive | — | Lecture audio streaming |
| **Key Libraries** | expo-av | — | Audio playback + azan |
| | expo-location | — | GPS for Qibla, mosques, travel |
| | expo-sensors | — | Magnetometer (compass) |
| | expo-notifications | — | Push notifications + azan alerts |
| | fuse.js | — | Client-side fuzzy search |
| | react-native-svg | — | Qibla compass rendering |

**Theme:** Dark mode — `#121212` primary · `#1E1E1E` cards · `#252525` tertiary · **`#D4A84B` gold accent** · `#E8C87A` light gold · `#B8942F` dark gold

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Minimum | Notes |
|------------|---------|-------|
| Node.js | 18+ | Backend + mobile tooling |
| Python | 3.10+ | AI service + ML scoring |
| Ollama | latest | Local LLM — [ollama.com](https://ollama.com) |
| MongoDB | Atlas (free tier) | Cloud database |
| Expo Go | latest | Mobile app testing ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)) |

### 1 · Clone & Configure

```bash
git clone https://github.com/<your-username>/Musafir.git
cd Musafir

# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI and JWT secret
```

### 2 · Backend API

```bash
cd backend
npm install
npm run dev                     # → http://localhost:5000
```

### 3 · AI Chat Service

```bash
# Pull required Ollama models (one-time)
ollama pull llama3.2
ollama pull nomic-embed-text

# Start AI service
cd services/ai
python -m venv venv
venv\Scripts\activate           # Windows  (source venv/bin/activate on macOS/Linux)
pip install -r requirements.txt

# First-time data ingestion
python prepare_tafseer.py       # Convert JSON → text
python ingest.py                # Build ChromaDB vector store

python api_server.py            # → http://localhost:5001
```

### 4 · Download ML Models (one-time)

```bash
cd backend
git clone https://huggingface.co/BAAI/bge-base-en-v1.5      # ~400 MB embeddings
git clone https://huggingface.co/BAAI/bge-reranker-base      # ~1 GB reranker
```

### 5 · Mobile App

```bash
cd mobile-app
npm install
npx expo start                  # Scan QR with Expo Go
```

> **Important:** Set `API_BASE_URL` in `src/services/api.js` to your machine's LAN IP (e.g., `http://192.168.1.100:5000`).

### Running All Services (4 terminals)

```bash
ollama serve                                    # Terminal 1: LLM server
cd backend && npm run dev                       # Terminal 2: Backend API
cd services/ai && python api_server.py          # Terminal 3: AI Chat
cd mobile-app && npx expo start                 # Terminal 4: Mobile App
```

---

## 📁 Folder Structure

```
Musafir/
├── README.md
├── .env.example
├── .gitignore
│
├── backend/                        Express 5 REST API
│   ├── server.js                   Entry point (port 5000)
│   ├── controllers/                7 controllers (auth, hadith, message, quiz, quran, salat, user)
│   ├── models/                     6 Mongoose schemas (Hadith, Message, Quran, SalatScore, SurahMetadata, User)
│   ├── routes/                     8 route files
│   ├── middleware/                 Auth + error handling
│   ├── ml-search/                  ONNX semantic search (BGE embedder + reranker + query normalizer)
│   ├── scripts/                    Data import & generation utilities
│   ├── config/                     Database connection
│   ├── bge-base-en-v1.5/          ⛔ .gitignored — 400 MB ONNX model
│   └── bge-reranker-base/         ⛔ .gitignored — 1 GB ONNX model
│
├── mobile-app/                     Expo / React Native client
│   ├── App.js                      Entry: AuthProvider → SettingsProvider → NotificationBootstrap → AudioProvider
│   ├── src/
│   │   ├── screens/                34 screens
│   │   ├── services/               16 service modules
│   │   ├── navigation/             AppNavigator (5-tab + auth stack)
│   │   ├── context/                AuthContext, AudioContext, SettingsContext
│   │   ├── theme/                  Color constants
│   │   ├── utils/                  Helpers
│   │   └── data/                   Bundled offline Quran, dua, lecture data
│   └── package.json
│
├── services/
│   ├── ai/                         LangChain + Ollama + ChromaDB chatbot (Flask, port 5001)
│   └── ml-scoring/                 FastAPI Arabic handwriting scorer (AraCLIP)
│
├── quran/                          Shared Quran JSON data
│   ├── surah/                      114 surah files (Arabic + metadata)
│   ├── translation/                3 languages: ar/, en/, id/
│   ├── tajweed/                    114 tajweed-annotated surah files
│   └── quiz/                       119 quiz files (114 per-surah + 5 metadata)
│
├── hadith-json/                    Hadith collection data + TypeScript scraper
│   └── db/by_book/the_9_books/     Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasai, Ibn Majah
│
├── new tafseer/                    Abridged Explanation of the Quran (JSON)
├── tazkirul-quran-en.json/         Tazkirul Quran English tafseer
├── data/                           Legacy tafseer data
├── docs/                           Project documentation, reports, slides
└── AudioStreamService/             ⛔ .gitignored — 5 GB Quran audio files
```

---

## 📜 AI Knowledge Base

The ILM AI chatbot is trained on **7 curated Islamic texts** ingested into ChromaDB via LangChain:

| Text | Description |
|------|-------------|
| **Abridged Explanation of the Quran** | Concise tafsir of all 114 surahs |
| **Tafsir Ma'arif-ul-Quran** (English) | Mufti Muhammad Shafi's comprehensive Quran commentary |
| **Tazkirul Quran** (English) | Surah-by-surah Quran reflection |
| **Bahishti Zewar** | Maulana Ashraf Ali Thanwi's guide on Islamic jurisprudence & daily life |
| **Ihya Ulum-ud-Din** Vol 1 (English) | Imam al-Ghazali's Revival of the Religious Sciences |
| **Sahih Bukhari** (JSON) | The most authentic hadith collection |
| **Tafseer.txt** | Additional tafseer commentary |

This means ILM's answers are grounded in centuries of Islamic scholarship — not scraped web content.

---

## 🚫 Gitignored Assets

| Item | Size | Reason |
|------|------|--------|
| `AudioStreamService/` | ~5 GB | MP3 Quran recitation files |
| `backend/bge-base-en-v1.5/` | ~400 MB | ONNX embedding model — clone from HuggingFace |
| `backend/bge-reranker-base/` | ~1 GB | ONNX reranker model — clone from HuggingFace |
| `services/ai/chroma_db/` | ~60 MB | Generated vector store — rebuild with `ingest.py` |
| `backend/vector_index.json` | ~100 MB | Generated search index |
| `node_modules/` | ~800 MB | Restore with `npm install` |
| `venv/` / `.venv/` | ~1.2 GB | Restore with `pip install -r requirements.txt` |
| `*.safetensors`, `*.bin`, `*.onnx` | varies | Model weight files |
| `*.mp3`, `*.zip` | varies | Large media and archives |

---

## 🐛 Bug Report

A full bug report covering all commits in this repository is available in the docs folder:

👉 **[docs/BUG_REPORT.md](docs/BUG_REPORT.md)**

The report documents 12 issues ranging from a ReDoS security vulnerability and hardcoded developer IPs to scoring logic inconsistencies and missing data files, each with severity ratings and suggested fixes.

---

## 🤝 Contributing

Musafir is a labor of love for the ummah. Contributions are welcome:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 🙏 Acknowledgments

- **[Aladhan API](https://aladhan.com/)** — Islamic calendar and prayer time data
- **[OpenStreetMap](https://www.openstreetmap.org/)** — Mosque geolocation via Overpass API
- **[Internet Archive](https://archive.org/)** — Islamic lecture audio hosting
- **[Ollama](https://ollama.com/)** — Local LLM inference
- **[LangChain](https://langchain.com/)** — RAG pipeline orchestration
- **[HuggingFace](https://huggingface.co/)** — BGE embedding & reranker models
- The scholars whose works power our AI: **Mufti Muhammad Shafi**, **Imam al-Ghazali**, **Maulana Ashraf Ali Thanwi**, and the compilers of the six hadith collections

---

<div align="center">

**Built with ❤️ and Taqwa**

*"And whoever puts their trust in Allah, He will be enough for them."* — At-Talaq 65:3

**سُبْحَانَ ٱللَّهِ وَبِحَمْدِهِ**

</div>
