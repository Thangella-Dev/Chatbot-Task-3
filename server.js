const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const { dbPing, getAnswerByIntentOrDb, getQuickQuestions } = require("./src/knowledge");
const { detectLanguage } = require("./src/language");
const { getCurrentWeatherAnswerIfAny } = require("./src/weather");
const { geminiGenerateText, geminiState } = require("./src/gemini");

const app = express();
app.use(cors());
app.use(express.json({ limit: "256kb" }));

const PORT = Number(process.env.PORT || 8000);
const API_HOST = process.env.HOST || "127.0.0.1";

app.get("/", (_req, res) => res.json({ status: "ok" }));

app.get("/status", async (_req, res) => {
  const db = await dbPing().catch((e) => ({ ok: false, error: String(e?.message || e) }));
  res.json({
    status: "ok",
    port: PORT,
    db: db,
    gemini_available: geminiState.available,
    gemini_key_set: geminiState.keySet,
    gemini_model: geminiState.model,
    gemini_lang_detect: geminiState.langDetectEnabled,
    gemini_last_error: geminiState.lastError,
    gemini_last_error_at: geminiState.lastErrorAt,
  });
});

app.get("/quick-questions", async (_req, res) => {
  const questions = await getQuickQuestions();
  res.json({ questions });
});

app.post("/detect-language", async (req, res) => {
  const text = String(req.body?.text || "").trim();
  const hintLocale = String(req.body?.hint_locale || "").trim().toLowerCase() || null;
  if (!text) return res.status(400).json({ error: "No text provided" });

  const result = await detectLanguage(text, hintLocale);
  if (!result) return res.status(400).json({ error: "Could not detect language" });

  res.json({
    language_code: result.code,
    language_name: result.name,
    language_hint: `You are speaking ${result.name}.`,
    detector: result.detector,
  });
});

app.post("/chat/query", async (req, res) => {
  const text = String(req.body?.text || "").trim();
  if (!text) return res.status(400).json({ error: "No text provided" });

  // 1) Weather (live)
  const weather = await getCurrentWeatherAnswerIfAny(text);
  if (weather) return res.json({ user_text: text, bot_response: weather, source: "weather" });

  // 2) Intent + DB
  const kb = await getAnswerByIntentOrDb(text);
  if (kb) return res.json({ user_text: text, bot_response: kb.answer, source: kb.source });

  // 3) Optional Gemini fallback
  const gem = await geminiGenerateText(text);
  if (gem) return res.json({ user_text: text, bot_response: gem, source: "gemini" });

  // 4) Local fallback (no debug link)
  const last = (geminiState.lastError || "").toLowerCase();
  const quotaLimited = last.includes("resource_exhausted") || last.includes("quota") || last.includes("rate");
  const prefix = geminiState.keySet
    ? quotaLimited
      ? "AI fallback is rate-limited or quota-exhausted right now. Please wait and try again."
      : "I don't have a local answer for that. AI fallback is configured, but it's not available right now."
    : "";

  const fallback = "I'm not sure about that yet. You can ask me about: delivery types, available items, delivery hours, order tracking, or payment methods.";
  const msg = prefix ? `${prefix}\n\n${fallback}` : fallback;
  res.json({ user_text: text, bot_response: msg, source: "fallback" });
});

async function boot() {
  await dbPing();
  try {
    // Ensures the `knowledge` table exists (otherwise give a clearer startup failure)
    await getQuickQuestions();
  } catch (e) {
    throw new Error(`Database is reachable, but the knowledge table is missing. Run: npm run db:migrate (then npm run db:seed). Error: ${e?.message || String(e)}`);
  }
  app.listen(PORT, API_HOST, () => {
    // eslint-disable-next-line no-console
    console.log(`VoiceFlow API listening on http://${API_HOST}:${PORT}`);
  });
}

boot().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", e);
  process.exitCode = 1;
});
