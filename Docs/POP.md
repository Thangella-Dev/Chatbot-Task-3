# PoP (Proof of Project)

## Goal
Local-first chatbot demo with:
- Static web UI (text + voice)
- Node.js API backend
- Real database server (Postgres)

## What works
- Prompt chips + suggestion chips
- Voice-to-text input (browser SpeechRecognition)
- Answers from Postgres knowledge base (delivery assistant dummy data)
- Local intent matching for paraphrases
- Weather with city (Open-Meteo live data)
- Optional Gemini fallback for non-DB questions (when configured and not rate-limited)

## Demo steps
1) Start Postgres (local install or hosted)
2) Install + migrate + seed: `npm install`, `npm run db:migrate`, `npm run db:seed`
3) Start backend: `npm start`
4) Open `Frontend/index.html` and chat
