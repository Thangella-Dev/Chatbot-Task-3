# Requirements (What you need and why)

This file lists everything required/optional to run this project, with a short reason for each item.

## System requirements

| Item | Required | Why it is needed | How to verify |
|---|---:|---|---|
| Node.js | Yes | Runs the backend API (`server.js`) and DB scripts (`db/migrate.js`, `db/seed.js`). | `node -v` |
| npm | Yes | Installs backend dependencies and runs scripts. | `npm -v` |
| PostgreSQL server | Yes | Stores the knowledge-base data in a real DB server (`knowledge` table). | `psql --version` (client) + `Invoke-RestMethod http://127.0.0.1:8000/status` (server DB check) |
| Web browser (Chrome/Edge recommended) | Yes | Runs the static frontend and chat widget UI. | Open `Frontend/index.html` |

## Backend dependencies (installed by `npm install`)

| Package | Required | Why it is used | Where it is used |
|---|---:|---|---|
| `express` | Yes | Backend HTTP server + routes. | `server.js` |
| `cors` | Yes | Allows the frontend to call the backend without CORS blocking. | `server.js` |
| `dotenv` | Yes | Loads `.env` (DB URL + optional AI settings). | `server.js`, `db/migrate.js`, `db/seed.js` |
| `pg` | Yes | PostgreSQL driver for Node.js. | `src/db.js`, `src/knowledge.js` |
| `franc-min` | Yes | Local language detection from text. | `src/language.js` |
| `@google/generative-ai` | Optional | Gemini fallback for non-DB questions (only when enabled). | `src/gemini.js` |
| `nodemon` (dev) | Optional | Auto-restarts backend during development. | `npm run dev` |

## Configuration requirements (`.env`)

| Variable | Required | Why it is used | Example |
|---|---:|---|---|
| `DATABASE_URL` | Yes | Connects Node backend to Postgres. | `postgres://voiceflow:voiceflow@127.0.0.1:5432/voiceflow` |
| `PORT` | Optional | Changes backend port (default `8000`). | `8000` |
| `HOST` | Optional | Changes bind host (default `127.0.0.1`). | `127.0.0.1` |
| `DEFAULT_CITY` | Optional | Weather queries without a city. | `Hyderabad` |
| `GEMINI_API_KEY` | Optional | Enables Gemini fallback. | `...` |
| `GEMINI_MODEL` | Optional | Gemini model name. | `gemini-flash-latest` |
| `GEMINI_LANG_DETECT` | Optional | Enables Gemini language detection (`1` to enable). | `0` or `1` |

## APIs used (internal + external)

| API | Required | Why it is used | Internet needed |
|---|---:|---|---:|
| Open-Meteo (external) | Optional | Live weather answers. | Yes |
| Gemini (external) | Optional | General Q&A fallback. | Yes |

## Voice (mic) requirement

| Feature | Required | Why it is used | Internet needed |
|---|---:|---|---:|
| Browser `SpeechRecognition` | Optional | Mic voice-to-text in UI. | Usually yes (depends on browser/OS) |

## Data requirement

| Item | Required | Why it is used | Where it lives |
|---|---:|---|---|
| Knowledge base seed data | Yes (for demo answers) | Inserts demo Q/A rows into Postgres. | `db/seeds/*.sql` -> Postgres `knowledge` table |
