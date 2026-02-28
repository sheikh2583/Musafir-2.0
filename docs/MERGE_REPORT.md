# Musafir Merge Report — v1 + v2 → Production

**Date:** 2026-02-28  
**Approach:** v2 as master, v1 AI logic cherry-picked into `services/ai/`

---

## 1. Structural Mapping

### Source → Target Path Mapping

| Source File/Folder | Target in /Musafir | Action |
|---|---|---|
| `Musafir v2/backend/**` | `backend/**` | **Copy as-is** (master) |
| `Musafir v2/mobile-app/**` | `mobile-app/**` | **Copy as-is** (master) |
| `Musafir v2/quran/**` | `quran/**` | **Copy as-is** (includes quiz/) |
| `Musafir v2/hadith-json/**` | `hadith-json/**` | **Copy as-is** |
| `Musafir v2/new tafseer/**` | `new tafseer/**` | **Copy as-is** |
| `Musafir v2/tazkirul-quran-en.json/**` | `tazkirul-quran-en.json/**` | **Copy as-is** |
| `Musafir v2/docs/**` | `docs/**` | **Copy + cherry-pick** |
| `Musafir v1/langchain/api_server.py` | `services/ai/api_server.py` | **Cherry-pick + enhance** |
| `Musafir v1/langchain/chat.py` | `services/ai/chains/chat.py` | **Cherry-pick** |
| `Musafir v1/langchain/fast_chat.py` | `services/ai/chains/fast_chat.py` | **Cherry-pick** |
| `Musafir v1/langchain/ingest.py` | `services/ai/ingest.py` | **Cherry-pick** |
| `Musafir v1/langchain/prepare_tafseer.py` | `services/ai/prepare_tafseer.py` | **Cherry-pick** |
| `Musafir v1/langchain/start.py` | `services/ai/start.py` | **Cherry-pick** |
| `Musafir v1/langchain/requirements.txt` | `services/ai/requirements.txt` | **Cherry-pick + enhance** |
| `Musafir v1/langchain/chroma_db/` | `services/ai/chroma_db/` | **Cherry-pick** |
| `Musafir v1/langchain/data/` | `services/ai/data/` | **Cherry-pick** |
| `Musafir v1/ml-service/*` | `services/ml-scoring/*` | **Cherry-pick** |
| `Musafir v1/data/tafseer.txt` | `data/tafseer.txt` | **Cherry-pick** |
| `Musafir v1/docs/MERGE_CHECKLIST_MATRIX.md` | `docs/MERGE_CHECKLIST_MATRIX.md` | **Cherry-pick** (v1-only) |

### Explicitly Dropped

| File | Source | Reason |
|---|---|---|
| `Musafir v2/backend - Copy/` | v2 | Accidental duplicate backup |
| `Musafir v2/.expo/` (root) | v2 | Root-level Expo cache, not needed |
| `Musafir v1/PROJECT_OVERVIEW.txt` | v1 | Superseded by merged README.md |
| `Musafir v1/arabic-swipe-writing.html` | v1 | HTML prototype, replaced by ArabicWritingScreen |
| `Musafir v1/merge_translations.js` | v1 | One-time migration script |
| `Musafir v1/.vscode/` | v1 | IDE-specific config |
| `Musafir v1/mobile-app/src/data/quran_test.json` | v1 | Test/duplicate data |
| `Musafir v1/langchain/test_imports.py` | v1 | Debug utility |
| `Musafir v1/langchain/__pycache__/` | v1 | Build artifact |

---

## 2. Dependency Alignment

### 2.1 Backend (Node.js) — IDENTICAL

Both versions have exactly the same `package.json`. Zero conflicts.

```
@xenova/transformers: ^2.17.2
axios: ^1.6.0
bcryptjs: ^3.0.3
chromadb: ^3.2.2
cors: ^2.8.5
dotenv: ^17.2.3
express: ^5.2.1
express-validator: ^7.3.1
helmet: ^8.1.0
jsonwebtoken: ^9.0.3
mongoose: ^9.0.1
nodemailer: ^7.0.11
ollama: ^0.6.3
onnxruntime-node: ^1.23.2
nodemon: ^3.1.11 (dev)
```

### 2.2 Mobile App — Minor v2 additions

v2 adds `buffer@^6.0.3` and `jpeg-js@^0.4.4` for image processing in AI scoring. v2's pinned Expo versions are preferred (`expo-linking ~8.0.11`, `react-native-gesture-handler ~2.28.0`).

**Decision:** Use v2's `package.json` as-is.

### 2.3 Python AI Service (services/ai) — ⚠️ VERSION SENSITIVITY

| Package | Pinned | Pydantic Requirement | Notes |
|---|---|---|---|
| `langchain==0.3.14` | Yes | `pydantic>=2.0` | **BREAKING if pydantic v1 installed** |
| `langchain-community==0.3.14` | Yes | Same as above | — |
| `langchain-ollama==0.2.2` | Yes | — | Requires Ollama ≥0.3.0 |
| `langchain-huggingface==0.1.2` | Yes | — | Pulls sentence-transformers |
| `sentence-transformers==3.3.1` | Yes | — | Pulls torch≥2.0 |
| `chromadb>=0.5.0` | Semi-pinned | — | Must match langchain-chroma |
| `flask>=3.0.0` | Added | — | **NEW** (was not in v1) |
| `flask-cors>=4.0.0` | Added | — | **NEW** (enables CORS from backend) |

**⚠️ Breaking Changes:**
1. **Pydantic v1→v2**: If any other package requires `pydantic<2`, there will be a conflict. Use separate venv.
2. **torch size**: CPU-only install is ~2GB. Add `--index-url https://download.pytorch.org/whl/cpu` for smaller installs.
3. **Ollama model availability**: `llama3.2` and `nomic-embed-text` must be pre-pulled.

### 2.4 ML Scoring (services/ml-scoring) — FULLY ISOLATED

Runs in its own venv. No cross-dependencies with LangChain:
```
fastapi, uvicorn, torch, transformers, Pillow, python-multipart, sentencepiece, protobuf
```

---

## 3. Redundancy Filter — Detailed

### Config Files

| Config | v1 | v2 | **Keep** | Cherry-Pick Logic |
|---|---|---|---|---|
| `backend/.env.example` | Has QURAN_SEARCH_MODE | Same | **Merged** | Added LANGCHAIN_API_URL |
| `backend/.gitignore` | Standard | Same | **v2** | Identical |
| `backend/package.json` | 15 deps | Same 15 | **v2** | Identical |
| `mobile-app/package.json` | 17 deps | 19 deps | **v2** | v2 adds buffer, jpeg-js |
| `hadith-json/biome.json` | Linter config | Same | **v2** | Identical |
| `hadith-json/tsconfig.json` | TS config | Same | **v2** | Identical |

### Middleware

| Middleware | v1 | v2 | **Keep** |
|---|---|---|---|
| `auth.middleware.js` | JWT protect + authorize | Same | **v2** (identical) |

### Controllers

| Controller | v1 | v2 | Decision |
|---|---|---|---|
| `auth.controller.js` | 97 lines | Same | **v2** |
| `user.controller.js` | 257 lines | Same | **v2** |
| `message.controller.js` | 68 lines | Same | **v2** |
| `quran.controller.js` | 561 lines | Same | **v2** |
| `hadith.controller.js` | 592 lines | Same | **v2** |
| `quiz.controller.js` | — | 456 lines | **v2** (NEW) |
| `salat.controller.js` | — | 298 lines | **v2** (NEW) |

### Screens

| Screen | v1 | v2 | Decision |
|---|---|---|---|
| HomeScreen | ~350 lines | 1172 lines | **v2** (Hijri, salat, events) |
| ChatScreen (v1) / AIChatScreen (v2) | ~200 lines | ~320 lines | **v2** (better UI, history) |
| SurahQuizScreen | — | 740 lines | **v2** (NEW) |
| SalatLeaderboardScreen | — | 536 lines | **v2** (NEW) |
| HijriCalendarScreen | — | 796 lines | **v2** (NEW) |
| All others | Present | Enhanced | **v2** |

---

## 4. Integration Bridge

### Request Flow: Mobile → Backend → AI Service

```
AIChatScreen.js
  │ POST { message: "What is Ayatul Kursi?", history: [...] }
  ▼
backend/routes/chat.routes.js
  │ Reads LANGCHAIN_API_URL from env (default: http://127.0.0.1:5001/chat)
  │ POST { query: message, history: history }
  ▼
services/ai/api_server.py
  │ 1. ChromaDB.similarity_search(query, k=4)
  │ 2. Build system prompt with context
  │ 3. Ollama llama3.2 chat completion
  │ Returns: { response: "...", sources: [...] }
  ▼
backend/routes/chat.routes.js
  │ Returns: { success: true, message: response, sources: sources }
  ▼
AIChatScreen.js
  └── Renders response + source citations
```

### Modifications Made to Bridge

1. **`backend/routes/chat.routes.js`** — Updated to read `LANGCHAIN_API_URL` from environment instead of hardcoded URL. Added `GET /api/chat/health` endpoint.

2. **`services/ai/api_server.py`** — Enhanced from v1 original:
   - Added environment variable configuration
   - Added CORS support (flask-cors)
   - Improved system prompt (Islamic scholar persona)
   - Added `/health` endpoint
   - Increased similarity search to k=4
   - Better error handling with connection-specific messages
   - Source metadata included in response

3. **`services/ai/requirements.txt`** — Enhanced from v1:
   - Added `flask-cors`, `chromadb`, `tqdm`
   - Added `langchain-chroma` (was implicit import)
   - Added comments about version sensitivity

---

## 5. Context Isolation Verification

| Service | Runs On | Port | State | Isolation Method |
|---|---|---|---|---|
| Backend API | Node.js | 5000 | MongoDB + file-based caches | Separate process |
| AI Chat | Python/Flask | 5001 | ChromaDB + Ollama | **Separate folder + venv + process** |
| ML Scoring | Python/FastAPI | 8000 | Stateless | **Separate folder + venv + process** |
| Mobile App | React Native | Expo | AsyncStorage + bundled JSON | Separate process |

The v1 AI logic in `services/ai/` is fully isolated:
- Own `requirements.txt` (separate pip environment)
- Own process (Flask on port 5001)
- No shared imports with backend Node.js code
- Communication only via HTTP API
- No global state pollution — all state in ChromaDB directory
