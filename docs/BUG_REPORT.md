# Musafir — Bug Report

**Date:** 2026-03-02  
**Scope:** All commits in the repository (`Requirements` commit — Sheikh Mosheul Akbar, 2026-03-02)  
**Reviewed by:** Copilot SWE Agent

---

## Summary

| ID | Severity | Component | Title |
|----|----------|-----------|-------|
| BUG-001 | 🔴 High | `backend/server.js` | Hardcoded developer LAN IP in startup log |
| BUG-002 | 🔴 High | `backend/controllers/user.controller.js` | ReDoS vulnerability — unsanitized regex from user input |
| BUG-003 | 🟠 Medium | `backend/models/User.model.js` | Email regex rejects valid modern TLDs (4+ chars) |
| BUG-004 | 🟠 Medium | `backend/routes/chat.routes.js` | Health URL derived via naïve string replace on chat URL |
| BUG-005 | 🟠 Medium | `services/ai/api_server.py` | Missing CORS setup despite flask-cors being declared as a dependency |
| BUG-006 | 🟠 Medium | `backend/controllers/salat.controller.js` | Weekly score reset based on prayer count, not calendar week |
| BUG-007 | 🟠 Medium | `backend/controllers/salat.controller.js` | Consecutive scoring formula is inconsistent and self-contradicting |
| BUG-008 | 🟡 Low | `backend/controllers/salat.controller.js` | `checkConsecutive` returns fixed `skippedCount: 5` after > 24 h gap |
| BUG-009 | 🟡 Low | `backend/controllers/quiz.controller.js` | `surah.json` metadata file is missing from repository |
| BUG-010 | 🟡 Low | `services/ml-scoring/scoring_service.py` | Dead code — cosine fallback branch is unreachable |
| BUG-011 | 🟡 Low | `mobile-app/App.js` | `useEffect` dependency array misses new settings properties |
| BUG-012 | 🟡 Low | `backend/controllers/quran.controller.js` | Verse `number` field uses arbitrary formula not reflecting true global ayah number |

---

## Detailed Bug Descriptions

---

### BUG-001 · 🔴 High — Hardcoded Developer LAN IP in Startup Log

**File:** `backend/server.js`  
**Line:** 93  
**Commit:** `1780d93` (Requirements)

**Description:**  
The server startup log hardcodes a developer-specific LAN IP address (`192.168.3.93`). This is a local network address specific to the developer's machine and will be misleading on any other deployment environment.

```js
// server.js:93
console.log(`🌐 Accessible at http://localhost:${PORT} and http://192.168.3.93:${PORT}`);
```

**Impact:**  
- The printed URL will be wrong on every environment except the original developer's machine.
- Other developers (and CI/CD pipelines) will see a false "accessible at" address, potentially causing confusion during setup.

**Suggested Fix:**
```js
console.log(`🌐 Accessible at http://localhost:${PORT}`);
```
Or derive the LAN IP dynamically via the `os` module.

---

### BUG-002 · 🔴 High — ReDoS Vulnerability in User Search

**File:** `backend/controllers/user.controller.js`  
**Lines:** 36–38  
**Commit:** `1780d93` (Requirements)

**Description:**  
The `searchUsers` function takes user-supplied input and passes it directly into MongoDB's `$regex` operator without any escaping or sanitization. A malicious user can provide a crafted regex pattern (e.g., `(a+)+$`) that causes catastrophic backtracking in the regex engine, leading to a Denial of Service (ReDoS).

```js
// user.controller.js:36-38
const users = await User.find({
  name: { $regex: q, $options: 'i' }
})
```

**Impact:**  
- High CPU usage on the database side, potentially bringing the server to its knees.
- Attackers can craft a query that takes exponential time to evaluate.

**Suggested Fix:**  
Escape the query string before using it as a regex pattern:
```js
const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const users = await User.find({
  name: { $regex: escapedQ, $options: 'i' }
})
```
Alternatively, use a full-text index (`$text` operator) instead of `$regex`.

---

### BUG-003 · 🟠 Medium — Email Regex Rejects Valid Modern TLDs

**File:** `backend/models/User.model.js`  
**Lines:** 17–20  
**Commit:** `1780d93` (Requirements)

**Description:**  
The email validation regex ends with `\.\w{2,3}` which only allows top-level domains of 2 or 3 characters. Valid modern TLDs such as `.info`, `.shop`, `.online`, `.travel`, `.academy` (4+ characters) are incorrectly rejected.

```js
// User.model.js:17-20
match: [
  /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
  'Please add a valid email',
],
```

**Impact:**  
- Users with email addresses on modern TLDs (`.info`, `.tech`, `.online`, etc.) cannot register.
- Could block a significant portion of potential users.

**Suggested Fix:**  
Change `\w{2,3}` to `\w{2,}` to allow TLDs of any length:
```js
/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/
```
Or use the built-in `express-validator` email validator (already used in `auth.routes.js`) and remove the redundant regex from the model.

---

### BUG-004 · 🟠 Medium — Chat Health URL Derived via Naïve String Replace

**File:** `backend/routes/chat.routes.js`  
**Line:** 7  
**Commit:** `1780d93` (Requirements)

**Description:**  
The health check URL is derived from `PYTHON_API_URL` using a simple string replace of `'/chat'` with `'/health'`. If the `LANGCHAIN_API_URL` environment variable contains the substring `/chat` in any position other than the path end (e.g., the hostname `http://chat.example.com:5001/chat`), the replacement will produce an incorrect URL.

```js
// chat.routes.js:7
const PYTHON_HEALTH_URL = PYTHON_API_URL.replace('/chat', '/health');
```

For `http://chat.example.com:5001/chat`, this produces `http://health.example.com:5001/chat` (wrong).

**Impact:**  
- Health check endpoint fails silently when the AI service host contains `/chat` in its name.
- Operators may think the AI service is down when it is actually running.

**Suggested Fix:**  
Derive the health URL from the base URL, not by replacing the path:
```js
const base = PYTHON_API_URL.substring(0, PYTHON_API_URL.lastIndexOf('/'));
const PYTHON_HEALTH_URL = `${base}/health`;
```

---

### BUG-005 · 🟠 Medium — Missing CORS Setup in AI Service

**File:** `services/ai/api_server.py`  
**Commit:** `1780d93` (Requirements)

**Description:**  
The merge report (`docs/MERGE_REPORT.md` §3) explicitly states that `flask-cors` was added to `services/ai/requirements.txt` and CORS support was enabled. However, `api_server.py` never imports or initialises `flask_cors`:

```python
# api_server.py — actual imports
from flask import Flask, request, jsonify
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings
import requests
```

There is no `from flask_cors import CORS` and no `CORS(app)` call.

**Impact:**  
- Browser-based front-end clients (or any client making cross-origin requests) will receive CORS errors.
- In practice the mobile app calls the backend which proxies to the AI service, so this is not immediately visible, but direct browser-to-AI-service calls will fail.

**Suggested Fix:**  
Add to `api_server.py`:
```python
from flask_cors import CORS
# after app = Flask(__name__)
CORS(app)
```

---

### BUG-006 · 🟠 Medium — Weekly Score Reset Based on Prayer Count, Not Calendar Week

**File:** `backend/controllers/salat.controller.js`  
**Lines:** 86–97  
**Commit:** `1780d93` (Requirements)

**Description:**  
The weekly score resets after exactly 35 recorded prayers (`weeklyPrayerCount >= 35`). This is an approximation of 7 days × 5 prayers/day, but it does not align with any real calendar week. If a user skips prayers, or prays extra times, their "week" will shift out of sync with the actual calendar week. Furthermore, skipped prayers (recorded via `skipPrayer`) do not increment `weeklyPrayerCount`, so a user who skips prayers all week and then prays 35 times in a single day would trigger a weekly reset immediately.

```js
// salat.controller.js:86-87
if (score.weeklyPrayerCount >= 35) {
  // Reset for new week
```

**Impact:**  
- The leaderboard becomes unfair — users who skip prayers effectively get more prayers in their "extended week".
- `weekStartDate` is already stored in the schema but is never used for the weekly reset condition.

**Suggested Fix:**  
Replace the count-based check with a date-based check using `weekStartDate`:
```js
const now = new Date();
const weekStart = new Date(score.weekStartDate);
const daysSinceWeekStart = (now - weekStart) / (1000 * 60 * 60 * 24);
if (daysSinceWeekStart >= 7) {
  // Reset for new week
}
```

---

### BUG-007 · 🟠 Medium — Scoring Formula is Inconsistent and Self-Contradicting

**File:** `backend/controllers/salat.controller.js`  
**Lines:** 106–118  
**Commit:** `1780d93` (Requirements)

**Description:**  
The consecutive prayer scoring block contains a developer comment that says "let me fix this" mid-code, followed by a formula that produces unexpected results. When `weeklyScore` is already large (e.g., 50) and a new consecutive prayer comes in, `Math.max(1, 50) * (multiplier)` produces `50 * multiplier`, which exponentially inflates the score. The `if (score.weeklyScore === 0) pointsEarned = 1` guard on line 117 is then immediately overwritten on line 118 by assigning `pointsEarned` (which was already calculated on lines 114–116) to `weeklyScore`.

```js
// salat.controller.js:106-118
let pointsEarned = 0;
if (isConsecutive) {
  score.currentMultiplier += 1;
  pointsEarned = score.weeklyScore * score.currentMultiplier;
  // Actually, let's re-read the logic: ...
  pointsEarned = Math.max(1, score.weeklyScore) * score.currentMultiplier;
  if (score.weeklyScore === 0) pointsEarned = 1; // First prayer
  score.weeklyScore = pointsEarned;            // ← overwrites regardless
```

**Impact:**  
- Scores can grow unboundedly and exponentially with consecutive prayers.
- The first consecutive prayer edge case (`weeklyScore === 0`) sets `pointsEarned = 1` but then immediately stores `pointsEarned` (which was already set to `Math.max(1, 0) * multiplier = 1 * 2 = 2`) into `weeklyScore`, making the guard on line 117 effectless.

**Suggested Fix:**  
Redesign the scoring formula with a clear, documented algorithm:
```js
if (isConsecutive) {
  score.currentMultiplier = Math.min(score.currentMultiplier + 1, 10); // cap multiplier
  pointsEarned = score.currentMultiplier;
  score.weeklyScore += pointsEarned;
} else {
  score.currentMultiplier = 1;
  pointsEarned = 1;
  score.weeklyScore += 1;
}
```

---

### BUG-008 · 🟡 Low — `checkConsecutive` Returns Inaccurate `skippedCount` After >24h Gap

**File:** `backend/controllers/salat.controller.js`  
**Lines:** 38–41  
**Commit:** `1780d93` (Requirements)

**Description:**  
When more than 24 hours have passed since the last prayer, the function returns a hardcoded `skippedCount: 5`. This is imprecise — if a user prayed Fajr yesterday and then prays Fajr today (25 hours later), the count should be 4 (Dhuhr, Asr, Maghrib, Isha were missed), not 5.

```js
// salat.controller.js:38-41
if (hoursDiff > 24) {
  return { isConsecutive: false, skippedCount: 5 };
}
```

**Impact:**  
- Incorrect skipped prayer count in response data — downstream analytics or UI displays will show wrong skip statistics.

**Suggested Fix:**  
Calculate the actual number of skipped prayers based on the number of full days elapsed and the position within the prayer order.

---

### BUG-009 · 🟡 Low — Missing `surah.json` Metadata File

**File:** `backend/controllers/quiz.controller.js`  
**Lines:** 14, 28  
**Commit:** `1780d93` (Requirements)

**Description:**  
The quiz controller references a `surah.json` file at `quran/surah.json` for surah metadata. This file is not present in the repository. The controller handles the missing file gracefully (returns a fallback `Surah ${surahNumber}` string), but surah names will never be correctly populated.

```js
// quiz.controller.js:14
const SURAH_METADATA_PATH = path.join(__dirname, '../../quran/surah.json');
```

**Impact:**  
- All quiz responses will show generic names like `"Surah 1"` instead of `"Al-Fatihah"`.
- Poor user experience in the quiz screens.

**Suggested Fix:**  
Add `quran/surah.json` to the repository with the standard 114-surah metadata array, or update the path to point to an existing metadata source.

---

### BUG-010 · 🟡 Low — Unreachable Dead Code in ML Scoring Service

**File:** `services/ml-scoring/scoring_service.py`  
**Lines:** 77–82  
**Commit:** `1780d93` (Requirements)

**Description:**  
A fallback cosine-similarity branch is guarded by `if len(text_prompts) == 1`, but `text_prompts` is always assigned a 3-element list on line 48–53. The condition can therefore never be `True`.

```python
# scoring_service.py:48-53 (always 3 items)
text_prompts = [
    request.target_text,
    "خربشة",
    "فارغ"
]

# scoring_service.py:77-82 (unreachable)
if len(text_prompts) == 1:
    image_embeds = outputs.image_embeds
    ...
```

**Impact:**  
- Dead code adds confusion and maintenance burden.
- If the intent was to handle a future single-prompt mode, there is no mechanism to reach this branch.

**Suggested Fix:**  
Remove the dead code block entirely, or refactor `text_prompts` to be configurable so the branch can actually be triggered.

---

### BUG-011 · 🟡 Low — `useEffect` Dependency Array Incomplete in `App.js`

**File:** `mobile-app/App.js`  
**Line:** 23  
**Commit:** `1780d93` (Requirements)

**Description:**  
The `useEffect` in `NotificationBootstrap` only lists three specific settings keys (`azanNotifications`, `azanSound`, `eventNotifications`) in its dependency array. If new notification-related settings are added in the future (e.g., `hadithNotifications`, `prayerReminderOffset`), the effect will not re-run when those settings change, causing stale notification configurations.

```js
// App.js:23
}, [loaded, settings.azanNotifications, settings.azanSound, settings.eventNotifications]);
```

**Impact:**  
- New settings properties added to `SettingsContext` will not trigger notification re-initialisation.
- Silent bug — the user changes a notification setting and it appears to save, but the notification service is not updated.

**Suggested Fix:**  
Pass the entire `settings` object as a dependency, or restructure so that all notification-related settings are grouped into a single sub-object:
```js
}, [loaded, settings]);
```
(Ensure `settings` reference changes on mutation, or use a stable serialised comparison.)

---

### BUG-012 · 🟡 Low — Verse `number` Field Does Not Use Standard Global Ayah Numbering

**File:** `backend/controllers/quran.controller.js`  
**Line:** 45  
**Commit:** `1780d93` (Requirements)

**Description:**  
The verse `number` field is computed as `((surahNumber - 1) * 1000) + verseNum`. This is an arbitrary scheme and does not match the universally accepted global Quran ayah numbering (1–6236). For example, Surah 2 (Al-Baqarah) verse 1 would get number `1001` in this scheme but should be `7` globally (after Al-Fatihah's 7 verses).

```js
// quran.controller.js:45
number: ((surahNumber - 1) * 1000) + verseNum,
```

**Impact:**  
- Cross-referencing verse numbers with external Quran APIs or scholarly sources will fail.
- Any feature that depends on a globally unique, sequential verse number (e.g., bookmarking by verse number, sharing links) will produce confusing numbers.

**Suggested Fix:**  
Either use standard global ayah numbering (computed from a lookup table of surah verse counts), or rename this field to something unambiguous like `localId` so that consumers are not misled.

---
