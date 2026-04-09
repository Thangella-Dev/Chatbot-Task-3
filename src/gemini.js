const { GoogleGenerativeAI } = require("@google/generative-ai");

const state = {
  available: true,
  keySet: Boolean(process.env.GEMINI_API_KEY),
  model: (process.env.GEMINI_MODEL || "gemini-flash-latest").trim() || "gemini-flash-latest",
  langDetectEnabled: String(process.env.GEMINI_LANG_DETECT || "").trim().toLowerCase() === "1",
  lastError: null,
  lastErrorAt: null,
};

function setError(message) {
  state.lastError = message;
  state.lastErrorAt = message ? new Date().toISOString() : null;
}

async function geminiGenerateText(prompt, opts = {}) {
  if (!state.keySet) {
    setError("GEMINI_API_KEY not set");
    return null;
  }
  const useSystem = opts.system !== false;
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: state.model });

    const result = await model.generateContent(useSystem ? prompt : prompt);
    const text = result?.response?.text?.();
    if (!text || !String(text).trim()) {
      setError("Gemini returned empty response");
      return null;
    }
    setError(null);
    return String(text).trim();
  } catch (e) {
    setError(`Gemini request failed: ${e?.name || "Error"}: ${e?.message || String(e)}`);
    return null;
  }
}

module.exports = { geminiGenerateText, geminiState: state };

