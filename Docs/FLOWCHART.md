# Flowchart (Node.js + Postgres)

```mermaid
flowchart TD
  U[User] -->|Type / mic transcript| UI[Frontend UI]

  UI -->|GET /quick-questions| API[Node/Express API]
  UI -->|POST /detect-language| API
  UI -->|POST /chat/query| API

  API -->|Language detect| LD[Script + franc-min (+ optional Gemini)]
  API -->|Weather intent| WX[Open-Meteo]
  API -->|Intent/paraphrase| INT[Local intent matcher]
  API -->|KB lookup| PG[(Postgres)]
  API -->|Optional fallback| G[Gemini]

  API -->|JSON| UI
  UI -->|Render messages + suggestions| FEED[Chat Feed]
```

