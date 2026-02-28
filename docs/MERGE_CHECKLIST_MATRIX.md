# Musafir Project Merge Checklist Matrix

Use this document to merge this branch with a slightly different version without losing behavior.

## 1) How to Use This Matrix

1. For each capability, compare both versions side by side.
2. Mark **Winner** (`This`, `Other`, or `Hybrid`).
3. List exact files kept from each side.
4. Confirm route/API compatibility with mobile app.
5. Run the validation checks at the end.

---

## 2) Capability Merge Matrix (Fill During Merge)

| Capability | Current Version (This Workspace) | Other Version | Winner | Keep/Replace Files | Notes/Risks |
|---|---|---|---|---|---|
| Auth (register/login/me) | Express + Mongo + JWT |  |  |  |  |
| Users (search/profile/subscribe) | Express + Mongo |  |  |  |  |
| Messages feed | Express + Mongo |  |  |  |  |
| Quran read/list/juz | JSON file-based controller |  |  |  |  |
| Quran semantic search | Node `ml-search` vector route + engine |  |  |  |  |
| Hadith browse | JSON file-based controller |  |  |  |  |
| Hadith semantic search backend | Exists (`/api/hadith/search`) |  |  |  |  |
| Hadith semantic search mobile | Stubbed/disabled in mobile service |  |  |  |  |
| Chat API | Node proxy to Python `:5001/chat` |  |  |  |  |
| Python RAG service | Flask + Chroma + Ollama |  |  |  |  |
| Arabic handwriting scoring | FastAPI AraCLIP service (`:8000`) |  |  |  |  |
| Import/ETL scripts | Present (legacy + optional) |  |  |  |  |

---

## 3) Current Version Flow Inventory (Reference)

### A. Auth & Social Flow

- Mobile → `/api/auth`, `/api/users`, `/api/messages`
- Protected by JWT middleware
- Data in Mongo (`User`, `Message`)

Primary files:
- `backend/server.js`
- `backend/routes/auth.routes.js`
- `backend/routes/user.routes.js`
- `backend/routes/message.routes.js`
- `backend/controllers/auth.controller.js`
- `backend/controllers/user.controller.js`
- `backend/controllers/message.controller.js`
- `backend/middleware/auth.middleware.js`
- `backend/models/User.model.js`
- `backend/models/Message.model.js`

### B. Quran Read Flow

- Backend routes under `/api/quran/*`
- Uses local JSON files from `/quran` inside controller
- No Mongo reads in active Quran read path

Primary files:
- `backend/routes/quran.routes.js`
- `backend/controllers/quran.controller.js`
- `quran/surah/*.json`
- `quran/translation/en/*.json`
- `quran/surah.json`
- `quran/juz.json`

### C. Quran Semantic Search Flow

- Route used by mobile: `/api/quran/semantic-search`
- Controller calls `ml-search/search/vector-search`
- Query normalization uses Islamic term map

Primary files:
- `backend/controllers/quran.controller.js`
- `backend/ml-search/search/vector-search.js`
- `backend/ml-search/search/query-normalizer.js`
- `backend/scripts/islamic-terms-map.json`
- `backend/vector_index.json`

### D. Hadith Browse Flow

- Backend routes under `/api/hadith/*`
- Uses local hadith JSON from `hadith-json/db/by_book/the_9_books`

Primary files:
- `backend/routes/hadith.routes.js`
- `backend/controllers/hadith.controller.js`
- `hadith-json/db/by_book/the_9_books/*.json`

### E. Hadith Semantic Search Flow (Backend)

- Mounted before basic hadith routes to preserve search endpoint behavior
- Endpoint: `/api/hadith/search`

Primary files:
- `backend/server.js`
- `backend/ml-search/routes/hadith.routes.js`
- `backend/ml-search/controllers/hadith.controller.js`
- `backend/ml-search/search/hadith-vector-search.js`

### F. Mobile Quran/Hadith/Chat Integration

- API base URL set in mobile `api.js`
- Quran reading mostly local bundle in mobile service
- Hadith service calls API
- Chat screen posts to `/api/chat`

Primary files:
- `mobile-app/src/services/api.js`
- `mobile-app/src/services/quranService.js`
- `mobile-app/src/services/hadithService.js`
- `mobile-app/src/screens/ChatScreen.js`
- `mobile-app/src/navigation/AppNavigator.js`

### G. Node ↔ Python Chat Bridge

- Node route forwards chat to Python endpoint `http://127.0.0.1:5001/chat`

Primary files:
- `backend/routes/chat.routes.js`
- `langchain/api_server.py`
- `langchain/chat.py`
- `langchain/start.py`

### H. Arabic Writing AI Scoring

- Independent FastAPI service on `:8000`

Primary files:
- `ml-service/scoring_service.py`

---

## 4) Route Precedence Checks (Critical During Merge)

Verify these after resolving conflicts in `backend/server.js`:

- [ ] `hadithSearchRoutes` are mounted before `hadithRoutes`
- [ ] `quranSearchRoutes` are mounted before `quranRoutes`
- [ ] `chatRoutes` remain mounted at `/api/chat`
- [ ] Health route `/api/health` still works
- [ ] 404 and global error handlers remain last

---

## 5) Data Source Decision Checklist

For each domain, choose one canonical source to avoid split-brain behavior:

- [ ] Quran read source: `JSON files` or `Mongo`
- [ ] Hadith read source: `JSON files` or `Mongo`
- [ ] Quran semantic source: `Node vector index` or alternative
- [ ] Hadith semantic source: `Node vector index` or alternative
- [ ] Chat response source: `Python RAG` or `Node-only`

If hybrid, document exactly when each source is used.

---

## 6) Mobile Compatibility Checklist

- [ ] `mobile-app/src/services/api.js` base URL points to active backend host
- [ ] `/api/quran/semantic-search` response shape still matches `VerseSearchScreen`
- [ ] `/api/hadith/*` browse endpoints still match `HadithCollectionScreen`
- [ ] If enabling hadith semantic in mobile, wire `searchHadiths()` to `/api/hadith/search`
- [ ] `/api/chat` returns `{ success, message, sources }` expected by `ChatScreen`

---

## 7) Conflict Log (Fill As You Merge)

| File | Conflict Type | Resolution Chosen | Reason |
|---|---|---|---|
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

---

## 8) Post-Merge Validation Runs

### Backend

- [ ] Install deps: `cd backend && npm install`
- [ ] Start backend: `npm start`
- [ ] Health check: `GET /api/health`
- [ ] Smoke test: auth route
- [ ] Smoke test: quran list + semantic search
- [ ] Smoke test: hadith collections + hadith search
- [ ] Smoke test: chat route (`/api/chat`) with Python service running

### Mobile

- [ ] Install deps: `cd mobile-app && npm install`
- [ ] Run app: `npm start`
- [ ] Open Quran tab, Surah view, Verse Search
- [ ] Open Hadith tab, collection paging
- [ ] Open Chat tab and verify reply rendering

### Python Services (if used)

- [ ] Langchain env active and dependencies installed
- [ ] `langchain/api_server.py` running on `:5001`
- [ ] `ml-service/scoring_service.py` running on `:8000` (if feature needed)

---

## 9) Final Sign-Off

- [ ] All critical capabilities have a selected winner
- [ ] No duplicate/competing runtime paths left unintentionally
- [ ] Mobile app endpoints align with backend routes
- [ ] AI services required by selected features are documented and runnable
- [ ] Merge notes saved in this file

