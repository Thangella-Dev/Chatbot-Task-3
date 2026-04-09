const DEFAULT_CITY = String(process.env.DEFAULT_CITY || "").trim();

const WEATHER_CODE = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
};

function isWeatherQuestion(text) {
  const t = String(text || "").toLowerCase();
  return t.includes("weather") || t.includes("temperature") || t.includes("forecast");
}

function extractCity(text) {
  const m = String(text || "").match(/\b(?:in|at)\s+([a-zA-Z][a-zA-Z\s\.-]{1,60})\b/i);
  if (!m) return null;
  let city = (m[1] || "").trim().replace(/[.\-]+$/g, "");
  const trailing = new Set(["today", "now", "tomorrow", "please"]);
  const parts = city.split(/\s+/).filter(Boolean);
  while (parts.length && trailing.has(parts[parts.length - 1].toLowerCase().replace(/[.,!?]/g, ""))) parts.pop();
  city = parts.join(" ").trim();
  return city || null;
}

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "Chatbot-V2/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function getCurrentWeather(city) {
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?${new URLSearchParams({
    name: city,
    count: "1",
    language: "en",
    format: "json",
  }).toString()}`;
  const geo = await getJson(geoUrl);
  const top = geo?.results?.[0];
  if (!top) return null;

  const lat = top.latitude;
  const lon = top.longitude;
  if (typeof lat !== "number" || typeof lon !== "number") return null;

  const wxUrl = `https://api.open-meteo.com/v1/forecast?${new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "temperature_2m,wind_speed_10m,weather_code",
    timezone: "auto",
  }).toString()}`;
  const wx = await getJson(wxUrl);
  const current = wx?.current || {};
  const code = current.weather_code;
  const summary = WEATHER_CODE[code] || "Unknown conditions";

  let place = top.name || city;
  if (top.admin1) place += `, ${top.admin1}`;
  if (top.country) place += `, ${top.country}`;

  return {
    place,
    summary,
    temp_c: current.temperature_2m,
    wind_kmh: current.wind_speed_10m,
  };
}

async function getCurrentWeatherAnswerIfAny(text) {
  if (!isWeatherQuestion(text)) return null;
  const city = extractCity(text) || DEFAULT_CITY;
  if (!city) return "Tell me the city, like: “What’s the weather in Hyderabad?”";

  try {
    const wx = await getCurrentWeather(city);
    if (!wx) return `Sorry, I couldn’t find weather for “${city}”. Try another city name.`;
    return `${wx.summary} in ${wx.place}. Temperature ${wx.temp_c}°C, wind ${wx.wind_kmh} km/h.`;
  } catch {
    return `Sorry, I couldn’t fetch weather for “${city}” right now.`;
  }
}

module.exports = { getCurrentWeatherAnswerIfAny };

