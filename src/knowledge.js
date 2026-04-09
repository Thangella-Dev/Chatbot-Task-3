const { pool, dbPing } = require("./db");
const { normalize, contentTokens, tokenScore } = require("./normalize");

async function getQuickQuestions() {
  const desired = [
    "what information can you give",
    "what kind of deliveries do you provide",
    "what items are available",
    "do you deliver in 10 minutes",
    "what are your delivery hours",
    "how to track my order",
    "what payment methods are accepted",
  ];

  // Prefer a curated set (stable, no duplicates) if those rows exist in the DB.
  const curated = await pool.query(
    "select question from knowledge where question_norm = any($1) order by array_position($1, question_norm) asc",
    [desired]
  );
  const curatedList = (curated.rows || []).map((row) => String(row.question || "").trim()).filter(Boolean);
  if (curatedList.length >= 4) return curatedList;

  // Fallback: first rows by id
  const r = await pool.query("select question from knowledge order by id asc limit 7");
  return (r.rows || []).map((row) => String(row.question || "").trim()).filter(Boolean);
}

async function getAnswerByNorm(norm) {
  const r = await pool.query("select answer from knowledge where question_norm=$1 limit 1", [norm]);
  return r.rows[0]?.answer || null;
}

async function localIntentAnswer(userText) {
  const t = normalize(userText);
  if (!t) return null;
  const words = new Set(t.split(" ").filter(Boolean));
  const anyHas = (...ws) => ws.some((w) => words.has(w));

  if ((words.has("track") || words.has("tracking")) && words.has("order")) return "how to track my order";
  if (words.has("payment") || (words.has("pay") && anyHas("method", "methods", "options"))) return "what payment methods are accepted";
  if (words.has("medicine") || words.has("medicines")) return "do you deliver medicine";

  // Delivery time/ETA
  if ((words.has("deliver") || words.has("delivery")) && anyHas("eta", "time", "timing", "timings", "minutes", "minute", "window", "happens", "when", "long", "duration")) {
    return "do you deliver in 10 minutes";
  }
  if ((anyHas("hours", "timing", "timings", "time")) && (words.has("delivery") || words.has("deliveries"))) return "what are your delivery hours";

  if ((words.has("items") && anyHas("available", "have", "list")) || (words.has("what") && words.has("items") && words.has("available"))) return "what items are available";
  if (anyHas("product", "products", "catalog", "catalogue")) return "what items are available";

  if ((words.has("delivery") || words.has("deliveries") || words.has("deliver")) && anyHas("provide", "provided", "offer", "offered", "options", "available", "types", "type", "kind", "kinds", "service", "services")) {
    return "what kind of deliveries do you provide";
  }
  if (anyHas("service", "services") && anyHas("provide", "provided", "offer", "offered")) return "what kind of deliveries do you provide";

  if (
    words.has("help") ||
    words.has("capabilities") ||
    ((words.has("information") || words.has("info")) && anyHas("give", "provide", "share", "offer", "provided")) ||
    (words.has("what") && words.has("can") && words.has("you") && words.has("do"))
  ) {
    return "what information can you give";
  }

  return null;
}

async function findAnswerFuzzy(userText) {
  const textTokens = contentTokens(userText);
  if (textTokens.size === 0) return null;

  const r = await pool.query("select question_norm, answer, question from knowledge");
  let bestScore = 0;
  let bestAnswer = null;

  for (const row of r.rows) {
    const qTokens = contentTokens(row.question_norm);
    if (qTokens.size === 0) continue;
    const score = tokenScore(textTokens, qTokens);
    if (score > bestScore) {
      bestScore = score;
      bestAnswer = row.answer;
    }
  }

  const threshold = textTokens.size <= 2 ? 0.65 : 0.55;
  return bestScore >= threshold ? bestAnswer : null;
}

async function getAnswerByIntentOrDb(userText) {
  // Intent mapping (paraphrases)
  const intent = await localIntentAnswer(userText);
  if (intent) {
    const ans = await getAnswerByNorm(normalize(intent));
    if (ans) return { answer: ans, source: "intent" };
  }

  // Exact match by normalized question
  const norm = normalize(userText);
  if (norm) {
    const exact = await getAnswerByNorm(norm);
    if (exact) return { answer: exact, source: "knowledge_base" };
  }

  // Fuzzy match (content tokens)
  const fuzzy = await findAnswerFuzzy(userText);
  if (fuzzy) return { answer: fuzzy, source: "knowledge_base" };

  return null;
}

module.exports = { pool, dbPing, getQuickQuestions, getAnswerByIntentOrDb };
