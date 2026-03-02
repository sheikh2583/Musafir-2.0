# Musafir — Islamic Companion App

> Quran · Hadith · AI Chat · Prayer Tracking · Dua & Adhkar · Islamic Lectures · Zakat Calculator · Hijri Calendar · Qibla Compass · Arabic Writing · Musafir (Travel) Mode

---

## Features

| Module | Highlights |
|--------|------------|
| **Quran** | 114 Surahs with Arabic, English translation, Tajweed, verse search, semantic search (ONNX) |
| **Hadith** | 6 collections (Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasai, Ibn Majah) + semantic search |
| **AI Chat** | Islamic knowledge chatbot with animated orb UI — backed by LangChain + Ollama + ChromaDB |
| **Prayer Tracking** | Salat logging with streaks, leaderboard, forbidden prayer times (Hanafi) |
| **Dua & Adhkar** | 72 duas across 11 categories with Arabic, transliteration, translation, favorites |
| **Islamic Lectures** | 900+ lectures from 9 speakers (Internet Archive), streaming player with speed control |
| **Zakat Calculator** | Nisab-based calculator with gold/silver/cash/stocks, donation portal links (bKash, Nagad, etc.) |
| **Hijri Calendar** | Islamic calendar with event markers, Ramadan Sehri/Iftar times (GPS-based) |
| **Qibla Compass** | Device magnetometer-based Qibla direction finder |
| **Musafir (Travel)** | GPS-based travel detection, Qasr prayer shortening, distance tracking |
| **Arabic Writing** | Swipe-to-write Arabic letters with ML scoring |
| **Quran Quiz** | Vocabulary & Tafsir quizzes (119 quiz files) with stats tracking |
| **Nearby Mosques** | Location-based mosque finder |
| **Push Notifications** | Prayer reminders, Hadith of the Day |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Mobile App (Expo SDK 54 / React Native 0.81)                  │
│  ├── 33 Screens                                                │
│  ├── 16 Service Modules                                        │
│  ├── Offline-first Quran data (bundled JSON)                   │
│  └── Dark theme (#121212)                                      │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP (Axios)
┌────────────────────▼────────────────────────────────────────────┐
│  Backend API (Express 5)          Port: 5000                    │
│  ├── /api/auth      — JWT authentication                       │
│  ├── /api/users     — User CRUD, subscriptions                 │
│  ├── /api/quran     — Surah data + semantic search (ONNX)      │
│  ├── /api/hadith    — 6 collections + semantic search           │
│  ├── /api/quiz      — Vocabulary + tafsir quizzes              │
│  ├── /api/salat     — Prayer tracking + leaderboard            │
│  └── /api/chat ─────┐ Proxy to AI service                     │
└──────────────────────┼──────────────────────────────────────────┘
                       │ HTTP (axios → Flask)
┌──────────────────────▼──────────────────────────────────────────┐
│  AI Chat Service (Flask/LangChain) Port: 5001   [services/ai]  │
│  ├── Ollama llama3.2 (LLM)                                     │
│  ├── nomic-embed-text (embeddings)                              │
│  └── ChromaDB (vector store)                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Backend API
```bash
cd backend
cp .env.example .env   # Edit with your MongoDB URI + JWT secret
npm install
npm run dev            # → http://localhost:5000
```

### 2. AI Chat Service
```bash
cd services/ai
python -m venv venv && venv\Scripts\activate   # Windows
pip install -r requirements.txt

# First time only:
python prepare_tafseer.py   # JSON → text
python ingest.py             # Build ChromaDB vector store

python api_server.py         # → http://localhost:5001
```

**Prerequisite:** Ollama must be running (`ollama serve`) with:
```bash
ollama pull llama3.2
ollama pull nomic-embed-text
```

### 3. Mobile App
```bash
cd mobile-app
npm install
npx expo start   # Scan QR with Expo Go
```
> Set `API_BASE_URL` in `src/services/api.js` to your machine's IP.

## Folder Structure

```
Musafir/
├── .env.example
├── .gitignore
├── README.md
│
├── backend/                       Express 5 API
│   ├── server.js
│   ├── controllers/               7 controllers
│   ├── models/                    6 Mongoose models
│   ├── routes/                    8 route files
│   ├── middleware/
│   ├── ml-search/                 ONNX semantic search (BGE)
│   ├── scripts/                   Data generation utilities
│   ├── bge-base-en-v1.5/         ⛔ .gitignored (417 MB model)
│   └── bge-reranker-base/        ⛔ .gitignored (1 GB model)
│
├── mobile-app/                    Expo / React Native
│   ├── src/
│   │   ├── screens/               33 screens
│   │   ├── services/              16 service modules
│   │   ├── navigation/
│   │   ├── context/
│   │   ├── theme/
│   │   ├── utils/
│   │   └── data/                  Bundled offline Quran data
│   └── package.json
│
├── services/
│   ├── ai/                        LangChain chatbot (Flask)
│   └── ml-scoring/                Arabic handwriting scorer
│
├── quran/                         Shared Quran JSON data
│   ├── surah/                     114 surah files
│   ├── translation/en/
│   ├── tajweed/
│   └── quiz/                      119 quiz files
│
├── hadith-json/                   Hadith collections + scraper
│   └── db/by_book/the_9_books/
│
├── AudioStreamService/            ⛔ .gitignored (5 GB audio)
├── data/                          Legacy tafseer data
├── new tafseer/                   Abridged Quran explanation
├── tazkirul-quran-en.json/        Tazkirul Quran tafseer
└── docs/                          Project documentation
```

## What's .gitignored (and why)

| Item | Size | Reason |
|------|------|--------|
| `AudioStreamService/` | ~5 GB | MP3 Quran recitation — stream externally |
| `backend/bge-base-en-v1.5/` | ~400 MB | ONNX embedding model — download separately |
| `backend/bge-reranker-base/` | ~1 GB | ONNX reranker model — download separately |
| `services/ai 2/` | ~1.8 GB | Legacy duplicate of `services/ai/` |
| `services/ai/chroma_db/` | ~60 MB | Generated vector store — rebuild via `ingest.py` |
| `backend/vector_index.json` | ~100 MB | Generated search index |
| `node_modules/` | ~800 MB | Restore via `npm install` |
| `venv/` / `.venv/` | ~1.2 GB | Restore via `pip install -r requirements.txt` |
| `*.safetensors`, `*.bin`, `*.onnx` | varies | Model weights |
| `*.mp3`, `*.zip` | varies | Large media/archives |

### Downloading Models (after clone)
```bash
# BGE embedding model
cd backend
git clone https://huggingface.co/BAAI/bge-base-en-v1.5

# BGE reranker
git clone https://huggingface.co/BAAI/bge-reranker-base
```

## Running All Services

```bash
# Terminal 1: Ollama
ollama serve

# Terminal 2: Backend API
cd backend && npm run dev

# Terminal 3: AI Chat Service
cd services/ai && python api_server.py

# Terminal 4: Mobile App
cd mobile-app && npx expo start
```

## Tech Stack

- **Mobile:** React Native 0.81, Expo SDK 54, React 19
- **Backend:** Express 5, Mongoose 9, ONNX Runtime
- **AI:** LangChain, Ollama (llama3.2), ChromaDB, Flask
- **Database:** MongoDB Atlas
- **Theme:** Dark (#121212 / #1E1E1E / #D4A84B accent)
