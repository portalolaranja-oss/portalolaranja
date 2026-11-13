// Integração CLIMA EM NOVA IGUAÇU do Portal O Laranja.
//
// Fonte primária: Climatempo (API pública). A chave fica em
// `VITE_CLIMATEMPO_API_KEY` (injetada no build). Sem chave, ou em falha,
// cai para Open-Meteo (gratuita, sem chave, coordenadas fixas de Nova Iguaçu)
// como fonte de dados reais — NUNCA usamos valores fictícios como "reais".
//
// Regras do pedido:
//  - localização fixa: Nova Iguaçu, RJ (coordenadas -23.0095, -43.6408).
//  - não simular: só dados reais de API (ou "indisponível").
//  - cache local para não martelar a API e manter offline tolerante.
//  - auto-atualização: timer + revalidação quando a aba volta a focar.

export interface WeatherDay {
  date: string; // ISO (local)
  label: string; // "hoje" | "seg" | "ter"…
  high: number;
  low: number;
  condition: string;
  code: string; // id da condição (para ícone)
}

export interface WeatherData {
  city: string;
  provider: "climatempo" | "open-meteo" | "cache";
  updatedAt: string; // ISO
  current: {
    temperature: number;
    feelsLike: number;
    condition: string;
    code: string;
    humidity: number; // %
    wind: number; // km/h
    windDir?: string;
  };
  forecast: WeatherDay[]; // 5 dias (incluindo hoje)
}

export interface WeatherStatus {
  available: boolean;
  configured: boolean; // Climatempo com chave?
  message: string;
  provider?: WeatherData["provider"];
  updatedAt?: string;
}

export const WEATHER_CITY = {
  name: "Nova Iguaçu",
  uf: "RJ",
  label: "Nova Iguaçu • RJ",
  latitude: -23.0095,
  longitude: -43.6408,
};

const CACHE_KEY = "ol-weather-cache-v1";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min
const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1h

function envString(name: string): string {
  const env = import.meta.env as Record<string, string | undefined>;
  return (env[name] ?? "").trim();
}

export function hasClimatempoKey(): boolean {
  return Boolean(envString("VITE_CLIMATEMPO_API_KEY"));
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function dayLabel(index: number): string {
  if (index === 0) return "Hoje";
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(new Date()).slice(0, 3).toUpperCase();
}

function weekdayLabel(d: Date): string {
  const s = new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(d).replace(".", "");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatTime(value: string | undefined): string {
  if (!value) return "nunca";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "nunca";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}

/** Mapeia código do Open-Meteo para condição legível + chave de ícone. */
function openMeteoCondition(code: number): { condition: string; key: string } {
  if (code === 0) return { condition: "Céu limpo", key: "clear" };
  if (code === 1 || code === 2) return { condition: "Parcialmente nublado", key: "partly-cloudy" };
  if (code === 3) return { condition: "Nublado", key: "cloudy" };
  if (code >= 45 && code <= 48) return { condition: "Nevoeiro", key: "fog" };
  if (code >= 51 && code <= 57) return { condition: "Garoa", key: "drizzle" };
  if (code >= 61 && code <= 67) return { condition: "Chuva", key: "rain" };
  if (code >= 71 && code <= 77) return { condition: "Neve", key: "snow" };
  if (code >= 80 && code <= 82) return { condition: "Pancadas de chuva", key: "showers" };
  if (code >= 85 && code <= 86) return { condition: "Tempestade", key: "thunder" };
  if (code === 95) return { condition: "Tempestade forte", key: "thunder" };
  return { condition: "Em observação", key: "cloudy" };
}

/* ------------------------------------------------------------------ */
/* Cache local                                                        */
/* ------------------------------------------------------------------ */

export function readCache(): WeatherData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as WeatherData;
    if (!data?.current?.temperature || !Array.isArray(data.forecast)) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(data: WeatherData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // sem storage (SSR/priv) — segue em memória
  }
}

/* ------------------------------------------------------------------ */
/* Provedores (dados reais)                                           */
/* ------------------------------------------------------------------ */

async function fetchClimatempo(): Promise<WeatherData> {
  const key = envString("VITE_CLIMATEMPO_API_KEY");
  const url =
    "https://oneapi.climatempo.pt/v2/now" +
    `?lat=${WEATHER_CITY.latitude}&lon=${WEATHER_CITY.longitude}` +
    `&city_name=${encodeURIComponent(WEATHER_CITY.name)}` +
    `&user_token=${encodeURIComponent(key)}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  const json = await res.json();
  if (!res.ok || !Array.isArray(json.data) || !json.data[0]) {
    throw new Error("Climatempo indisponível");
  }
  const row = json.data[0];
  const now: WeatherData = {
    city: WEATHER_CITY.label,
    provider: "climatempo",
    updatedAt: new Date().toISOString(),
    current: {
      temperature: Math.round(Number(row.t) || 0),
      feelsLike: Math.round(Number(row.t) || 0), // Climatempo "now" não devolve feelsLike
      condition: row.c?.text ?? "Céu limpo",
      code: String(row.c?.code ?? ""),
      humidity: Math.round(Number(row.r_h) || 0),
      wind: Math.round(Number(row.w_s) || 0),
      windDir: row.w_d,
    },
    forecast: [],
  };
  // Previsão 5 dias do Climatempo
  const fcUrl =
    "https://oneapi.climatempo.pt/v2/daily/5?lat=" +
    `${WEATHER_CITY.latitude}&lon=${WEATHER_CITY.longitude}` +
    `&city_name=${encodeURIComponent(WEATHER_CITY.name)}` +
    `&user_token=${encodeURIComponent(key)}`;
  const fcRes = await fetch(fcUrl, { headers: { accept: "application/json" } });
  const fcJson = await fcRes.json();
  if (fcRes.ok && Array.isArray(fcJson.data) && fcJson.data.length) {
    now.forecast = fcJson.data.slice(0, 5).map((d: { day?: string; tmax?: number; tmin?: number; c?: { text?: string; code?: string | number } }, i: number) => ({
      date: d.day ?? "",
      label: i === 0 ? "Hoje" : weekdayLabel(new Date(d.day)),
      high: Math.round(Number(d.tmax) || 0),
      low: Math.round(Number(d.tmin) || 0),
      condition: d.c?.text ?? "—",
      code: String(d.c?.code ?? ""),
    }));
  }
  return now;
}

async function fetchOpenMeteo(): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(WEATHER_CITY.latitude),
    longitude: String(WEATHER_CITY.longitude),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "America/Sao_Paulo",
    forecast_days: "5",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  const json = await res.json();
  if (!res.ok || !json.current) throw new Error("Open-Meteo indisponível");

  const cur = json.current as Record<string, number>;
  const code = openMeteoCondition(Number(cur.weather_code));
  const daily = json.daily ?? { time: [], weather_code: [], temperature_2m_max: [], temperature_2m_min: [] };

  const forecast: WeatherDay[] = (daily.time as string[]).slice(0, 5).map((date, i) => {
    const w = openMeteoCondition(Number(daily.weather_code?.[i]));
    return {
      date,
      label: i === 0 ? "Hoje" : weekdayLabel(new Date(date + "T12:00:00-03:00")),
      high: Math.round(Number(daily.temperature_2m_max?.[i]) || 0),
      low: Math.round(Number(daily.temperature_2m_min?.[i]) || 0),
      condition: w.condition,
      code: w.key,
    };
  });

  return {
    city: WEATHER_CITY.label,
    provider: "open-meteo",
    updatedAt: new Date().toISOString(),
    current: {
      temperature: Math.round(Number(cur.temperature_2m) || 0),
      feelsLike: Math.round(Number(cur.apparent_temperature) || 0),
      condition: code.condition,
      code: code.key,
      humidity: Math.round(Number(cur.relative_humidity_2m) || 0),
      wind: Math.round(Number(cur.wind_speed_10m) || 0),
      windDir: windCardinal(Number(cur.wind_direction_10m)),
    },
    forecast,
  };
}

function windCardinal(deg: number): string {
  const dirs = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"];
  return dirs[Math.round(((deg % 360) + 360) % 360 / 45) % 8] ?? "—";
}

/* ------------------------------------------------------------------ */
/* Orquestração + auto-update                                           */
/* ------------------------------------------------------------------ */

export interface FetchOptions {
  useCache?: boolean; // usa cache se estiver fresco
  force?: boolean; // ignora cache e tenta a rede
}

export async function fetchWeather(opts: FetchOptions = {}): Promise<WeatherData> {
  const { useCache = true, force = false } = opts;
  if (!force) {
    const cached = readCache();
    if (cached) {
      const age = Date.now() - new Date(cached.updatedAt).getTime();
      if (age < CACHE_TTL_MS) {
        // re-marca como vindo do cache, mas com dados frescos
        return { ...cached, provider: "cache" };
      }
    }
  }
  let data: WeatherData;
  if (hasClimatempoKey()) {
    try {
      data = await fetchClimatempo();
    } catch {
      data = await fetchOpenMeteo(); // fallback real
    }
  } else {
    data = await fetchOpenMeteo();
  }
  writeCache(data);
  return data;
}

export function weatherStatus(data: WeatherData | null): WeatherStatus {
  if (!data) {
    return {
      available: false,
      configured: hasClimatempoKey(),
      message: "Dados do clima temporariamente indisponíveis. Configure a API Climatempo no painel para exibir o tempo de Nova Iguaçu.",
    };
  }
  return {
    available: true,
    configured: hasClimatempoKey(),
    provider: data.provider,
    updatedAt: data.updatedAt,
    message:
      data.provider === "climatempo"
        ? "Fonte: Climatempo (API oficial)."
        : data.provider === "open-meteo"
          ? "Fonte: Open-Meteo (dados reais, sem chave)."
          : "Fonte: cache local (última atualização real).",
  };
}

export function lastUpdatedLabel(data: WeatherData | null): string {
  return formatTime(data?.updatedAt);
}

/* Auto-atualização: timer de 1h + revalidação ao focar a aba. */
export function startAutoRefresh(cb: () => void, intervalMs: number = REFRESH_INTERVAL_MS): () => void {
  const id = setInterval(cb, intervalMs);
  const onFocus = () => cb();
  if (typeof window !== "undefined") window.addEventListener("focus", onFocus);
  return () => {
    clearInterval(id);
    if (typeof window !== "undefined") window.removeEventListener("focus", onFocus);
  };
}
