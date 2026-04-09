# Chatbot-Task 3 (VoiceFlow)

VoiceFlow is a local-first chatbot web app with a premium floating chat widget (text + mic). It uses a **Node.js/Express** backend and a **PostgreSQL** knowledge base to answer delivery-assistant FAQs.

## Architecture (high level)
- Frontend: `Frontend/index.html` (static HTML/CSS/JS chat widget)
- Backend: `server.js` (Express API server)
- Database: Postgres `knowledge` table (seeded from `db/seeds/*.sql`)

## Quick start (Windows PowerShell)
From the project folder:
```powershell
npm install
Copy-Item .env.example .env
npm run db:migrate
npm run db:seed
npm start
```

Open the UI:
- `Frontend/index.html`

Verify backend:
```powershell
Invoke-RestMethod http://127.0.0.1:8000/status | ConvertTo-Json -Depth 6
```

## Key endpoints
Base URL: `http://127.0.0.1:8000`
- `GET /status` (DB connectivity + Gemini flags)
- `GET /quick-questions` (default chips from Postgres)
- `POST /detect-language` (language label)
- `POST /chat/query` (main answer endpoint)

## Offline vs internet
- Works offline: Node backend + Postgres + database-based answers.
- Needs internet:
  - Mic voice-to-text uses browser `SpeechRecognition` (typically requires internet in Chrome/Edge).
  - Weather answers use Open-Meteo.
  - Gemini fallback (if enabled) needs internet + API key.

## Docs (kept files)
- Requirements: `REQUIREMENTS.md`
- API docs: `Docs/DOCUMENTATION.md`
- Flowchart: `Docs/FLOWCHART.md`
- PoP (demo steps): `Docs/POP.md`

