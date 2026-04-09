function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "can",
  "could",
  "do",
  "does",
  "for",
  "from",
  "give",
  "help",
  "i",
  "in",
  "information",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "please",
  "tell",
  "that",
  "the",
  "this",
  "to",
  "today",
  "what",
  "whats",
  "when",
  "where",
  "who",
  "why",
  "will",
  "with",
  "you",
  "your",
]);

function contentTokens(text) {
  const tokens = normalize(text).split(" ").filter(Boolean);
  return new Set(tokens.filter((t) => t.length >= 3 && !STOPWORDS.has(t)));
}

function tokenScore(textTokens, qTokens) {
  if (!qTokens || qTokens.size === 0) return 0;
  let common = 0;
  for (const t of textTokens) if (qTokens.has(t)) common += 1;
  return common / Math.max(qTokens.size, 1);
}

module.exports = { normalize, contentTokens, tokenScore };

