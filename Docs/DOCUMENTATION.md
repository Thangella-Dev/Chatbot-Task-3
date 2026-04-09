# Documentation (Node.js + Postgres)

Base URL (default): `http://127.0.0.1:8000`

## Run commands (Windows PowerShell)
```powershell
cd C:\Users\THANGELLA\Desktop\Chatbot-V2
npm install
Copy-Item .env.example .env
npm run db:migrate
npm run db:seed
npm start
```

Open the UI:
- `Frontend/index.html`

## Endpoints

### GET /
Health check.

### GET /status
Runtime status for debugging:
- DB connectivity
- Gemini config + last error (if any)

### GET /quick-questions
Returns prompt chips for the UI.

Note:
- This endpoint reads the questions from the Postgres `knowledge` table (so `npm run db:seed` should be run at least once).

### POST /detect-language
Request:
```json
{ "text": "namaskaram" }
```
Response:
```json
{
  "language_code": "te",
  "language_name": "Telugu",
  "language_hint": "You are speaking Telugu.",
  "detector": "script"
}
```

Notes:
- Local-first detection: Unicode script heuristic + `franc-min`.
- Optional Gemini language detection can be enabled with `GEMINI_LANG_DETECT=1` (off by default).

Internet note:
- The UI mic uses the browser `SpeechRecognition` and may require internet depending on the browser/OS.

### POST /chat/query
Request:
```json
{ "text": "What items are available?" }
```

Response:
```json
{ "user_text": "What items are available?", "bot_response": "..." }
```

Decision order:
1) Weather (Open-Meteo) if the text looks like weather/temperature/forecast.
2) Local intent matcher for common paraphrases (works without Gemini).
3) Postgres knowledge base lookup (exact / fuzzy).
4) Optional Gemini fallback (if configured and not rate-limited).
5) Fallback helper message.

## Environment variables
Use `.env` (see `.env.example`).

Required for DB:
- `DATABASE_URL`

Optional:
- `DEFAULT_CITY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GEMINI_LANG_DETECT`

## Database checks (psql)
Connect:
```powershell
psql -U voiceflow -d voiceflow
```

List tables:
```sql
\dt
```

View knowledge data:
```sql
SELECT id, question, answer, created_at
FROM public.knowledge
ORDER BY id;
```
