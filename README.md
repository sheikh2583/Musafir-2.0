# Musafir — Merged Production Build

> Islamic Companion App: Quran, Hadith, AI Chat, Prayer Tracking, Arabic Writing

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Mobile App (Expo/React Native)   Port: Expo Dev Server        │
│  ├── 18 Screens (v2 master)                                    │
│  ├── Offline-first Quran data (bundled JSON)                    │
│  └── Services: Auth, Quran, Hadith, Salat, Calendar, AI Chat   │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP (Axios)
┌────────────────────▼────────────────────────────────────────────┐
│  Backend API (Express 5)          Port: 5000                    │
│  ├── /api/auth      — JWT authentication                       │
│  ├── /api/users     — User CRUD, subscriptions                 │
│  ├── /api/messages  — Social feed                              │
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

### 2. AI Chat Service (LangChain)
```bash
cd services/ai
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

# First time: Prepare and ingest tafseer data
python prepare_tafseer.py      # Converts JSON tafseer → text
python ingest.py               # Builds ChromaDB vector store

# Start the service
python api_server.py           # → http://localhost:5001
```

**Prerequisite:** Ollama must be running (`ollama serve`) with models pulled:
```bash
ollama pull llama3.2
ollama pull nomic-embed-text
```

### 3. Mobile App
```bash
cd mobile-app
npm install
npx expo start                 # Scan QR with Expo Go
```
> Update `API_BASE_URL` in `src/services/api.js` to your machine's IP.

## Folder Structure

```
Musafir/
├── .env.example                 # Unified env template (all services)
├── .gitignore
├── README.md
│
├── backend/                     # [SOURCE: v2] Express API
│   ├── server.js                # Entry point — 10 route groups
│   ├── package.json             # Express 5, Mongoose 9, ONNX Runtime
│   ├── config/db.js
│   ├── controllers/             # 7 controllers
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── message.controller.js
│   │   ├── quran.controller.js
│   │   ├── hadith.controller.js
│   │   ├── quiz.controller.js   # NEW in v2
│   │   └── salat.controller.js  # NEW in v2
│   ├── models/                  # 6 Mongoose models
│   │   ├── User.model.js
│   │   ├── Message.model.js
│   │   ├── SalatScore.model.js  # NEW in v2
│   │   ├── Quran.model.js
│   │   ├── Hadith.model.js
│   │   └── SurahMetadata.model.js
│   ├── routes/                  # 8 route files
│   │   └── chat.routes.js       # Bridge: proxies to services/ai
│   ├── middleware/auth.middleware.js
│   ├── ml-search/               # ONNX vector search (BGE)
│   │   ├── search/
│   │   │   ├── vector-search.js       # Quran: BGE-base 768-dim
│   │   │   ├── hadith-vector-search.js # Hadith: BGE-large 1024-dim
│   │   │   ├── query-normalizer.js     # 500+ Islamic term mappings
│   │   │   ├── ollama-search.js        # Alt: LLM-based search
│   │   │   └── ollama-hadith-search.js
│   │   ├── controllers/
│   │   └── routes/
│   ├── scripts/                 # Data generation utilities
│   │   ├── generateTafsirQuiz.js  # Quiz JSON generator
│   │   ├── extractQuranWordsV2.js # Vocabulary extractor
│   │   ├── build-term-map.js      # Islamic terms dictionary
│   │   └── importHadith.js        # MongoDB import
│   ├── bge-base-en-v1.5/       # ONNX embedding model
│   └── bge-reranker-base/      # ONNX reranker model
│
├── services/                    # Isolated microservices
│   ├── ai/                      # [SOURCE: v1] LangChain chatbot
│   │   ├── api_server.py        # Flask API (port 5001)
│   │   ├── ingest.py            # ChromaDB ingestion pipeline
│   │   ├── prepare_tafseer.py   # JSON → text converter
│   │   ├── start.py             # Entry point (auto-ingests if needed)
│   │   ├── requirements.txt     # Pinned LangChain + Chroma deps
│   │   ├── chains/
│   │   │   ├── chat.py          # RetrievalQA chain (CLI mode)
│   │   │   └── fast_chat.py     # Direct HTTP chat (CLI mode)
│   │   ├── chroma_db/           # Vector store (generated)
│   │   └── data/                # Tafseer text for ingestion
│   └── ml-scoring/              # [SOURCE: v1] Arabic handwriting
│       ├── scoring_service.py   # FastAPI + Arabic-CLIP
│       └── requirements.txt     # torch, transformers, Pillow
│
├── mobile-app/                  # [SOURCE: v2] Expo React Native
│   ├── App.js / index.js
│   ├── package.json             # Expo 54, RN 0.81, React 19
│   └── src/
│       ├── screens/             # 18 screens
│       ├── services/            # 9 service modules
│       ├── navigation/AppNavigator.js
│       ├── context/AuthContext.js
│       ├── theme/colors.js      # Dark theme (#121212)
│       ├── utils/               # QuizGenerator, ArabicPathGenerator
│       └── data/                # Bundled offline Quran JSONs
│
├── quran/                       # Shared Quran data
│   ├── surah.json / juz.json
│   ├── surah/                   # 114 surah JSON files
│   ├── translation/en/          # English translations
│   ├── tajweed/                 # Tajweed data
│   └── quiz/                    # 119 generated quiz files (v2)
│
├── hadith-json/                 # Hadith scraper + data
│   ├── db/by_book/the_9_books/  # 6 collection JSONs
│   └── src/                     # TypeScript scraper
│
├── new tafseer/                 # Abridged Quran explanation
│   └── abridged-explanation-of-the-quran.json
│
├── tazkirul-quran-en.json/      # Tazkirul Quran tafseer
│   └── tazkirul-quran-en.json
│
├── data/                        # Legacy tafseer text
│   └── tafseer.txt
│
└── docs/                        # Documentation
    ├── MERGE_REPORT.md          # ← This file (merge decisions)
    └── ...
```

## Merge Decisions

### Source Selection Matrix

| Component | Source | Rationale |
|-----------|--------|-----------|
| `backend/server.js` | **v2** | Has quiz + salat + chat routes, request logging |
| `backend/controllers/*` | **v2** | v2 is superset (7 controllers vs v1's 5) |
| `backend/models/*` | **v2** | Includes `SalatScore.model.js` |
| `backend/routes/*` | **v2** | Includes quiz, salat, chat routes |
| `backend/ml-search/*` | **v2** | Identical to v1 (verified) |
| `backend/scripts/*` | **v2** | Includes generateTafsirQuiz + extractQuranWordsV2 |
| `mobile-app/**` | **v2** | 18 screens vs v1's 15, dark theme, new features |
| `quran/quiz/` | **v2** | New in v2 |
| `services/ai/*` | **v1** | LangChain + Ollama + ChromaDB chatbot |
| `services/ml-scoring/*` | **v1** | Arabic-CLIP scoring service |
| `.env.example` | **Merged** | Combined from both + new AI service vars |

### Redundancy Eliminated

| Redundant Item | Kept | Dropped | Reason |
|----------------|------|---------|--------|
| `backend/package.json` | v2 | v1 | Identical deps |
| `langchain/` (root) | → `services/ai/` | Original location | Relocated for clean architecture |
| `ml-service/` (root) | → `services/ml-scoring/` | Original location | Relocated into services/ |
| `backend - Copy/` | — | v2 folder | Duplicate backup |
| `mobile-app/src/data/quran_test.json` | — | v1 only | Test duplicate |
| `PROJECT_OVERVIEW.txt` | — | v1 only | Superseded by this README |
| `arabic-swipe-writing.html` | — | v1 only | HTML prototype, replaced by RN screen |
| `merge_translations.js` | — | v1 only | One-time migration utility |

### Cherry-Picked from v1

| File | What was taken | Why |
|------|---------------|-----|
| `langchain/api_server.py` | Full file → `services/ai/api_server.py` | Core AI chat API |
| `langchain/chat.py` | Full file → `services/ai/chains/chat.py` | RetrievalQA chain |
| `langchain/fast_chat.py` | Full file → `services/ai/chains/fast_chat.py` | Fast HTTP-based chat |
| `langchain/ingest.py` | Full file → `services/ai/ingest.py` | ChromaDB ingestion |
| `langchain/prepare_tafseer.py` | Full file → `services/ai/prepare_tafseer.py` | Data preparation |
| `langchain/requirements.txt` | Enhanced → `services/ai/requirements.txt` | Added flask-cors, chromadb, tqdm |
| `ml-service/*` | Full files → `services/ml-scoring/` | Arabic handwriting scoring |
| `data/tafseer.txt` | Full file → `data/tafseer.txt` | Legacy text data |
| `docs/MERGE_CHECKLIST_MATRIX.md` | Full file | v1-only documentation |

## Dependency Analysis

### Backend (Node.js) — No Conflicts
Both v1 and v2 share identical `package.json` dependencies. No version conflicts.

| Package | Version | Status |
|---------|---------|--------|
| express | ^5.2.1 | ✅ Same |
| mongoose | ^9.0.1 | ✅ Same |
| @xenova/transformers | ^2.17.2 | ✅ Same |
| onnxruntime-node | ^1.23.2 | ✅ Same |
| bcryptjs | ^3.0.3 | ✅ Same |
| jsonwebtoken | ^9.0.3 | ✅ Same |

### Mobile App — Minor Differences (v2 wins)
| Package | v1 | v2 | Keep |
|---------|----|----|------|
| expo-linking | ~8.0.10 | ~8.0.11 | v2 (newer) |
| react-native-gesture-handler | ^2.30.0 | ~2.28.0 | v2 (Expo-pinned) |
| buffer | — | ^6.0.3 | v2 (new dep for AI scoring) |
| jpeg-js | — | ^0.4.4 | v2 (new dep for image processing) |

### Python AI Service — ⚠️ Breaking Changes Alert

| Issue | Detail | Mitigation |
|-------|--------|------------|
| **Pydantic v1 vs v2** | `langchain==0.3.14` requires `pydantic>=2.0`. If your system has `pydantic<2`, LangChain will crash. | Pin: `pip install pydantic>=2.7` |
| **sentence-transformers + torch** | `sentence-transformers==3.3.1` pulls `torch>=2.0`. Ensure CUDA compatibility if using GPU. | Use `--index-url https://download.pytorch.org/whl/cpu` for CPU-only |
| **chromadb version** | LangChain-Chroma requires matching chromadb. `langchain-chroma>=0.2.0` needs `chromadb>=0.5.0`. | Already pinned in requirements.txt |
| **Ollama API stability** | `langchain-ollama==0.2.2` — Ollama's API changed in recent versions. | Keep Ollama updated: `ollama --version` ≥ 0.3.0 |

### ML Scoring Service — Isolated (No Conflicts)
Runs independently with its own `requirements.txt` (torch, transformers, fastapi, Pillow). No cross-dependency with LangChain.

## Integration Bridge

The bridge between v2's frontend and v1's AI logic works through:

```
Mobile App (AIChatScreen.js)
    → POST /api/chat { message, history }
    → backend/routes/chat.routes.js
        → axios.post('http://127.0.0.1:5001/chat', { query, history })
        → services/ai/api_server.py
            → ChromaDB similarity_search(query, k=4)
            → Ollama llama3.2 chat completion
        ← { response, sources }
    ← { success: true, message, sources }
```

The `chat.routes.js` has been updated to:
1. Read `LANGCHAIN_API_URL` from environment (not hardcoded)
2. Include a `GET /api/chat/health` endpoint to check AI service status
3. Handle connection refused errors gracefully (503 response)

## Environment Variable Sync

See [.env.example](../.env.example) at project root for the unified template covering:
- Backend (MongoDB, JWT, CORS, Search Mode)
- AI Service (LangChain model, ChromaDB path, Ollama URL)
- ML Scoring (port)
- Mobile App (API base URL, Gemini key)

## Running All Services

```bash
# Terminal 1: Ollama (prerequisite)
ollama serve

# Terminal 2: Backend API
cd backend && npm run dev

# Terminal 3: AI Chat Service
cd services/ai && python api_server.py

# Terminal 4: Mobile App
cd mobile-app && npx expo start

# Optional Terminal 5: ML Scoring
cd services/ml-scoring && uvicorn scoring_service:app --port 8000
```
