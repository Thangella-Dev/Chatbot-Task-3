// ================= CONFIG =================
let apiBase = localStorage.getItem("apiBase") || "http://127.0.0.1:8000";

// ================= ELEMENTS =================
const el = {
  recordBtn:      document.getElementById("recordBtn"),
  recordLabel:    document.getElementById("recordLabel"),
  waveform:       document.getElementById("waveform"),
  chatFeed:       document.getElementById("chatFeed"),
  quickPrompts:   document.getElementById("quickPrompts"),
  textInput:      document.getElementById("textInput"),
  sendBtn:        document.getElementById("sendBtn"),
  clearChat:      document.getElementById("clearChat"),
  themeToggle:    document.getElementById("themeToggle"),
  themeIcon:      document.getElementById("themeIcon"),
  settingsPanel:  document.getElementById("settingsPanel"),
  openSettings:   document.getElementById("openSettings"),
  autoScroll:     document.getElementById("autoScrollToggle"),
  waveToggle:     document.getElementById("waveToggle"),
  chatWrapper:    document.getElementById("chatWrapper"),
  chatLauncher:   document.getElementById("chatLauncher"),
  launcherIcon:   document.getElementById("launcherIcon"),
  closeChat:      document.getElementById("closeChat"),
  loader:         document.getElementById("appLoader"),
  intro:          document.getElementById("introCard"),
};

const ICON_CHAT = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M6.75 2h10.5A2.75 2.75 0 0 1 20 4.75v7.5A2.75 2.75 0 0 1 17.25 15H9.3l-3.7 3.3a1 1 0 0 1-1.67-.75V15A2.75 2.75 0 0 1 4 12.25v-7.5A2.75 2.75 0 0 1 6.75 2Zm0 2a.75.75 0 0 0-.75.75v7.5c0 .41.34.75.75.75h.68a1 1 0 0 1 1 1v1.33l2.34-2.09a1 1 0 0 1 .66-.24h7.82c.41 0 .75-.34.75-.75v-7.5a.75.75 0 0 0-.75-.75H6.75Z"/>
    <path fill="currentColor" opacity="0.85" d="M13.2 6.1l.4 1.25c.1.3.34.54.64.64l1.25.4-1.25.4c-.3.1-.54.34-.64.64l-.4 1.25-.4-1.25a.95.95 0 0 0-.64-.64l-1.25-.4 1.25-.4c.3-.1.54-.34.64-.64l.4-1.25Z"/>
  </svg>
`;

const ICON_CLOSE = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M18.3 5.71a1 1 0 0 1 0 1.41L13.41 12l4.89 4.88a1 1 0 1 1-1.41 1.42L12 13.41l-4.88 4.89a1 1 0 1 1-1.42-1.41L10.59 12 5.7 7.12A1 1 0 0 1 7.12 5.7L12 10.59l4.88-4.89a1 1 0 0 1 1.42.01Z"/>
  </svg>
`;

const ICON_MIC = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm-1-8a1 1 0 1 1 2 0v5a1 1 0 1 1-2 0V6Z"/>
    <path fill="currentColor" opacity="0.9" d="M7 11a1 1 0 0 1 2 0 3 3 0 0 0 6 0 1 1 0 1 1 2 0 5 5 0 0 1-4 4.9V18h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-2.1A5 5 0 0 1 7 11Z"/>
  </svg>
`;

const ICON_STOP = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M8 8.5A2.5 2.5 0 0 1 10.5 6h3A2.5 2.5 0 0 1 16 8.5v7A2.5 2.5 0 0 1 13.5 18h-3A2.5 2.5 0 0 1 8 15.5v-7Z"/>
  </svg>
`;

// ================= STATE =================
let state = {
  recording:   false,
  recognition: null,
  prompts:     [],
  suggestions: null,
  liveBubble: null,
  liveTranscriptFinal: "",
  liveTranscriptInterim: "",
  lastSpeechError: null,
  micMode: "idle", // idle | recording | stopping
  micSession: 0,
  micAbortTimer: null,
  micForceTimer: null,
  hadConversationBeforeMic: false,
};

// ================= UTILS =================
function scrollToBottom() {
  if (el.autoScroll && el.autoScroll.checked) {
    el.chatFeed.scrollTop = el.chatFeed.scrollHeight;
  }
}

async function safeFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(err || "Request failed");
  }
  return res.json();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setBackendStatus(ok, text) {
  const pill = document.getElementById("backendStatus");
  const dot = document.getElementById("backendStatusDot");
  const label = document.getElementById("backendStatusText");
  if (!pill || !dot || !label) return;

  pill.classList.toggle("ok", Boolean(ok));
  pill.classList.toggle("bad", ok === false);
  label.textContent = text || (ok ? "Backend: connected" : "Backend: offline");
}

// ================= MESSAGES =================
function createMessage(type, text, meta = "") {
  const msg = document.createElement("div");
  msg.className = `message ${type}`;
  msg.innerHTML = `
    ${meta ? `<div class="meta">${meta}</div>` : ""}
    <div class="text">${escapeHtml(text)}</div>
  `;
  el.chatFeed.appendChild(msg);
  scrollToBottom();
  return msg;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function typingIndicator() {
  const msg = document.createElement("div");
  msg.className = "message bot typing-msg";
  msg.innerHTML = `
    <div class="meta">VoiceFlow</div>
    <div class="typing-dots"><span></span><span></span><span></span></div>
  `;
  el.chatFeed.appendChild(msg);
  scrollToBottom();
  return msg;
}

function setMessageMeta(msgEl, metaText) {
  if (!msgEl) return;
  const meta = msgEl.querySelector(".meta");
  if (meta) meta.textContent = metaText || "";
}

function setMessageText(msgEl, text) {
  if (!msgEl) return;
  const textEl = msgEl.querySelector(".text");
  if (textEl) textEl.textContent = text ?? "";
}

// ================= SUGGESTIONS =================
function clearSuggestions() {
  if (state.suggestions) {
    state.suggestions.remove();
    state.suggestions = null;
  }
}

function showSuggestions(prompts, excludeText = "") {
  clearSuggestions();
  const exclude = String(excludeText || "").trim().toLowerCase();
  const list = (prompts || [])
    .map(String)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((q) => q.toLowerCase() !== exclude);
  const seen = new Set();
  const unique = list.filter((q) => {
    const k = q.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  if (unique.length === 0) return;

  const msg = document.createElement("div");
  msg.className = "message bot suggestions-msg";
  msg.innerHTML = `
    <div class="meta">Try asking</div>
    <div class="suggestions"></div>
  `;

  const wrap = msg.querySelector(".suggestions");
  unique.forEach((q) => {
    const chip = document.createElement("button");
    chip.className = "chip chip-suggest";
    chip.textContent = q;
    chip.onclick = () => {
      el.textInput.value = q;
      handleSend();
    };
    wrap.appendChild(chip);
  });

  el.chatFeed.appendChild(msg);
  state.suggestions = msg;
  scrollToBottom();
}

// ================= LANGUAGE DISPLAY =================
const LANGUAGE_NAMES = {
  en: "English", es: "Spanish", fr: "French", de: "German",
  hi: "Hindi", bn: "Bengali", ta: "Tamil", te: "Telugu",
  ml: "Malayalam", gu: "Gujarati", mr: "Marathi", ur: "Urdu",
  ar: "Arabic", pt: "Portuguese", it: "Italian", ja: "Japanese",
  ko: "Korean", "zh-cn": "Chinese (Simplified)", "zh-tw": "Chinese (Traditional)",
  id: "Indonesian", ms: "Malay", pa: "Punjabi", fa: "Persian",
  ru: "Russian", fi: "Finnish", sw: "Swahili",
};

function getLangName(code) {
  return LANGUAGE_NAMES[code] || code;
}

// ================= API CALLS =================
async function detectLanguage(text) {
  return safeFetch(`${apiBase}/detect-language`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

async function queryBot(text) {
  return safeFetch(`${apiBase}/chat/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

// ================= CORE FLOW =================
async function processMessage(text, existingUserMsg = null) {
  text = text.trim();
  if (!text) return;

  // Hide intro once user interacts
  if (el.intro) el.intro.style.display = "none";
  if (el.quickPrompts) el.quickPrompts.classList.add("hidden");
  clearSuggestions();

  const userMsg = existingUserMsg || createMessage("user", text, "You · …");
  if (existingUserMsg) {
    setMessageText(userMsg, text);
  }
  const typing = typingIndicator();
  const typingStart = performance.now();
  const MIN_TYPING_MS = 450;

  try {
    // Run both calls in parallel for speed
    const [detection, data] = await Promise.all([
      detectLanguage(text).catch(() => ({ language_name: "Unknown", language_code: "??" })),
      queryBot(text),
    ]);

    // Ensure the typing indicator is visible for a short time (UX)
    const elapsed = performance.now() - typingStart;
    if (elapsed < MIN_TYPING_MS) await sleep(MIN_TYPING_MS - elapsed);

    typing.remove();

    const langLabel = detection.language_name || getLangName(detection.language_code) || "Unknown";
    setMessageMeta(userMsg, `You · ${langLabel}`);
    if (data.user_text && data.user_text.trim() && data.user_text.trim() !== text) {
      setMessageText(userMsg, data.user_text);
    }

    // Bot response
    const botText = data.bot_response && data.bot_response.toLowerCase() !== "data not present."
      ? data.bot_response
      : data.bot_response || "Sorry, I don't have that information yet.";

    createMessage("bot", botText, "VoiceFlow");
    showSuggestions(state.prompts, text);

  } catch (err) {
    const elapsed = performance.now() - typingStart;
    if (elapsed < MIN_TYPING_MS) await sleep(MIN_TYPING_MS - elapsed);
    typing.remove();
    console.error("processMessage error:", err);
    setMessageMeta(userMsg, "You · Unknown");

    // Show a helpful error rather than crashing silently
    const msg = err.message.includes("Failed to fetch")
      ? "⚠️ Cannot reach the server. Make sure it's running on " + apiBase
      : "⚠️ " + (err.message || "Something went wrong.");

    createMessage("bot", msg, "VoiceFlow");
    showSuggestions(state.prompts, text);
  }
}

// ================= TEXT INPUT =================
function handleSend() {
  const text = el.textInput.value.trim();
  if (!text) return;
  el.textInput.value = "";
  processMessage(text);
}

// ================= VOICE =================
function hideLandingPrompts() {
  if (el.intro) el.intro.style.display = "none";
  if (el.quickPrompts) el.quickPrompts.classList.add("hidden");
  clearSuggestions();
}

function restoreLandingPromptsIfNewChat() {
  if (!el.chatFeed) return;
  if (el.chatFeed.children.length !== 0) return;
  if (el.intro) el.intro.style.display = "";
  if (el.quickPrompts) el.quickPrompts.classList.remove("hidden");
}

function setListeningUi(listening) {
  const on = Boolean(listening);
  const stopping = state.micMode === "stopping";
  el.recordBtn.classList.toggle("recording", on);
  el.recordBtn.classList.toggle("stopping", stopping);
  el.recordBtn.disabled = stopping;
  setMicVisual(on);

  const showWave = on && !stopping && Boolean(el.waveToggle?.checked);
  el.waveform.classList.toggle("hidden", !showWave);
  el.waveform.classList.toggle("active", showWave);

  el.textInput.placeholder = on ? "Listening…" : "Type a message…";
}

function renderLiveBubble(text) {
  const t = String(text || "").trim();
  if (!t) return;

  if (!state.liveBubble) {
    state.liveBubble = createMessage("user", t, "Listening…");
    state.liveBubble.classList.add("live");
  } else {
    setMessageText(state.liveBubble, t);
  }
}

function clearMicTimers() {
  if (state.micAbortTimer) clearTimeout(state.micAbortTimer);
  if (state.micForceTimer) clearTimeout(state.micForceTimer);
  state.micAbortTimer = null;
  state.micForceTimer = null;
}

function cancelRecording() {
  // Invalidate any pending SpeechRecognition callbacks
  state.micSession += 1;
  clearMicTimers();

  try { state.recognition?.abort(); } catch {}
  try { state.recognition?.stop(); } catch {}

  state.micMode = "idle";
  state.recording = false;
  state.recognition = null;
  state.liveTranscriptFinal = "";
  state.liveTranscriptInterim = "";
  state.lastSpeechError = null;

  if (state.liveBubble) {
    try { state.liveBubble.remove(); } catch {}
    state.liveBubble = null;
  }

  setListeningUi(false);
}

function finishRecording(session, { send = true } = {}) {
  if (session !== state.micSession) return;

  const transcript = `${state.liveTranscriptFinal} ${state.liveTranscriptInterim}`.trim().replace(/\s+/g, " ");
  const err = state.lastSpeechError;
  const wasNewChat = !state.hadConversationBeforeMic;

  state.micMode = "idle";
  state.recording = false;
  state.recognition = null;
  state.liveTranscriptFinal = "";
  state.liveTranscriptInterim = "";
  state.lastSpeechError = null;
  state.hadConversationBeforeMic = false;
  clearMicTimers();
  setListeningUi(false);

  if (transcript && send) {
    let msgEl = state.liveBubble;
    state.liveBubble = null;

    if (msgEl) {
      msgEl.classList.remove("live");
      setMessageMeta(msgEl, "You · …");
      setMessageText(msgEl, transcript);
    }

    processMessage(transcript, msgEl);
    return;
  }

  if (state.liveBubble) {
    state.liveBubble.remove();
    state.liveBubble = null;
  }

  if (wasNewChat) {
    restoreLandingPromptsIfNewChat();
  }

  if (err === "not-allowed") {
    createMessage("bot", "Microphone access is blocked. Allow mic permission in the browser and try again.", "VoiceFlow");
  } else if (err === "no-speech") {
    createMessage("bot", "I didn’t catch that. Tap the mic and speak again.", "VoiceFlow");
  } else if (err === "audio-capture") {
    createMessage("bot", "No microphone was found. Check your mic and try again.", "VoiceFlow");
  }
}

async function startRecording() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    createMessage("bot", "Speech recognition is not supported in this browser. Try Chrome.", "VoiceFlow");
    return;
  }
  if (state.micMode !== "idle") return;

  // If the user starts with mic, hide default chips so the live transcript is visible.
  state.hadConversationBeforeMic = Boolean(el.chatFeed?.children?.length);
  hideLandingPrompts();

  // New mic session
  state.micSession += 1;
  const session = state.micSession;
  clearMicTimers();

  const rec = new SpeechRecognition();
  rec.lang = navigator.language || "en-US";
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;

  state.recognition = rec;
  state.recording = true;
  state.micMode = "recording";
  state.liveTranscriptFinal = "";
  state.liveTranscriptInterim = "";
  state.lastSpeechError = null;

  setListeningUi(true);
  el.textInput.focus();

  rec.onresult = (e) => {
    if (session !== state.micSession) return;
    let interim = "";
    let final = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) final += e.results[i][0].transcript;
      else interim += e.results[i][0].transcript;
    }

    if (final) state.liveTranscriptFinal += final;
    state.liveTranscriptInterim = interim;

    const live = `${state.liveTranscriptFinal} ${state.liveTranscriptInterim}`.trim().replace(/\s+/g, " ");
    if (live) {
      renderLiveBubble(live);
    }
  };

  rec.onerror = (e) => {
    if (session !== state.micSession) return;
    console.warn("Speech error:", e.error);
    state.lastSpeechError = e?.error || "unknown";
    try { rec.abort(); } catch {}
  };

  rec.onend = () => {
    finishRecording(session, { send: true });
  };

  try {
    rec.start();
  } catch (e) {
    state.lastSpeechError = "start-failed";
    finishRecording(session, { send: false });
    createMessage("bot", "Could not start microphone. Please refresh the page and allow mic permission.", "VoiceFlow");
    return;
  }

  // Safety stop in case the browser doesn't auto-end.
  state.micForceTimer = setTimeout(() => {
    if (state.micMode === "recording" && session === state.micSession) {
      stopRecording();
    }
  }, 12000);
}

function stopRecording() {
  if (state.micMode !== "recording") return;
  state.micMode = "stopping";
  setListeningUi(true);

  const rec = state.recognition;
  try { rec?.stop(); } catch {}

  // If stop() doesn't end quickly, force abort().
  const session = state.micSession;
  state.micAbortTimer = setTimeout(() => {
    if (state.micMode === "stopping" && session === state.micSession) {
      try { rec?.abort(); } catch {}
    }
  }, 900);

  // If the browser never fires onend, force cleanup.
  state.micForceTimer = setTimeout(() => {
    if (session === state.micSession && state.micMode !== "idle") {
      finishRecording(session, { send: true });
    }
  }, 2500);
}

function setMicVisual(recording) {
  const icon = el.recordBtn?.querySelector(".mic-icon");
  if (icon) icon.innerHTML = recording ? ICON_STOP : ICON_MIC;
  if (el.recordLabel) el.recordLabel.textContent = recording ? "Listening…" : "Tap to Speak";
}

// ================= CHAT TOGGLE =================
function setLauncherOpen(open) {
  if (!el.chatLauncher) return;
  el.chatLauncher.classList.toggle("open", open);
  el.chatLauncher.setAttribute("aria-label", open ? "Close chat" : "Open chat");
  if (el.launcherIcon) el.launcherIcon.innerHTML = open ? ICON_CLOSE : ICON_CHAT;
}

function toggleChat() {
  const willOpen = el.chatWrapper.classList.contains("hidden");
  el.chatWrapper.classList.toggle("hidden");
  setLauncherOpen(willOpen);
  if (willOpen) {
    el.textInput.focus();
  }
}

// ================= THEME =================
function applyTheme(dark) {
  document.body.classList.toggle("theme-dark", dark);
  el.themeIcon.textContent = dark ? "☀️" : "🌙";
  localStorage.setItem("theme", dark ? "dark" : "light");
}

function initTheme() {
  const dark = localStorage.getItem("theme") === "dark";
  el.themeToggle.checked = dark;
  applyTheme(dark);
}

// ================= QUICK PROMPTS =================
const FALLBACK_PROMPTS = [
  "What information can you give?",
  "What kind of deliveries do you provide?",
  "What items are available?",
  "Do you deliver in 10 minutes?",
  "What are your delivery hours?",
  "How to track my order?",
  "What payment methods are accepted?",
];

function renderPrompts(prompts) {
  if (!el.quickPrompts) return;
  el.quickPrompts.innerHTML = "";
  const seen = new Set();
  (prompts || []).forEach((q) => {
    const text = String(q || "").trim();
    if (!text) return;
    const k = text.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.textContent = text;
    chip.onclick = () => {
      el.textInput.value = text;
      handleSend();
    };
    el.quickPrompts.appendChild(chip);
  });
}

async function loadPrompts() {
  // Always show something even if backend is down
  state.prompts = FALLBACK_PROMPTS.slice();
  renderPrompts(state.prompts);
  try {
    const data = await safeFetch(`${apiBase}/quick-questions`);
    state.prompts = (data.questions && data.questions.length ? data.questions : FALLBACK_PROMPTS).slice();
    renderPrompts(state.prompts);
  } catch {
    // Keep fallback prompts
  }
}

async function checkBackend() {
  try {
    await safeFetch(`${apiBase}/status`).catch(() => safeFetch(`${apiBase}/`));
    setBackendStatus(true, "Backend: connected");
  } catch {
    setBackendStatus(false, "Backend: offline");
  }
}

// ================= EVENT LISTENERS =================
el.sendBtn.onclick = handleSend;
el.textInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

el.recordBtn.onclick = () => (state.micMode === "idle" ? startRecording() : stopRecording());
el.waveToggle.onchange = () => {
  if (state.micMode !== "idle") setListeningUi(true);
};

el.chatLauncher.onclick = toggleChat;
el.closeChat.onclick    = toggleChat;

el.clearChat.onclick = () => {
  cancelRecording();
  if (el.settingsPanel) el.settingsPanel.classList.add("hidden");
  el.textInput.value = "";
  el.textInput.placeholder = "Type a message…";
  el.waveform.classList.add("hidden");
  el.waveform.classList.remove("active");
  el.chatFeed.innerHTML = "";
  clearSuggestions();
  if (el.intro) el.intro.style.display = "";
  if (el.quickPrompts) el.quickPrompts.classList.remove("hidden");
  loadPrompts();
  el.chatFeed.scrollTop = 0;
};

el.openSettings.onclick = () => el.settingsPanel.classList.toggle("hidden");

el.themeToggle.onchange = () => applyTheme(el.themeToggle.checked);

// ================= BOOT =================
function boot() {
  initTheme();
  loadPrompts();
  setLauncherOpen(false);
  setMicVisual(false);
  checkBackend();
  // Hide loader
  setTimeout(() => el.loader?.classList.add("hide"), 400);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
