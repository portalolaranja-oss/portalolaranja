// Card de CLIMA EM NOVA IGUAÇU para a home do Portal O Laranja.
// Identidade visual do portal: fundo grafite, laranja oficial, tipografia Archivo.
// Mostra temperatura, sensação térmica, condição, umidade, vento, previsão
// de 5 dias e horário da última atualização. Auto-atualiza; não simula dados.

import { useEffect, useState } from "react";
import {
  Cloud,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Fog,
  RefreshCw,
  Sun,
  Wind,
  Zap,
} from "lucide-react";
import {
  WEATHER_CITY,
  fetchWeather,
  lastUpdatedLabel,
  readCache,
  startAutoRefresh,
  type WeatherData,
} from "@/lib/weather";

function WeatherIcon({ code, className = "h-5 w-5" }: { code: string; className?: string }) {
  switch (code) {
    case "clear":
      return <Sun className={className} />;
    case "partly-cloudy":
      return <CloudSun className={className} />;
    case "cloudy":
      return <Cloud className={className} />;
    case "rain":
    case "drizzle":
    case "showers":
      return <CloudRain className={className} />;
    case "snow":
      return <CloudSnow className={className} />;
    case "fog":
      return <Fog className={className} />;
    case "thunder":
      return <Zap className={className} />;
    default:
      return <CloudSun className={className} />;
  }
}

export function WeatherCard() {
  const [data, setData] = useState<WeatherData | null>(() => readCache());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(force = false) {
    setLoading(true);
    setError(null);
    try {
      const fresh = await fetchWeather(force ? { force: true } : {});
      setData(fresh);
    } catch {
      // mantém o cache se houver; senão informa indisponível
      const cached = readCache();
      if (cached) setData(cached);
      else setError("Dados do clima temporariamente indisponíveis.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(false);
    const stop = startAutoRefresh(() => load(true));
    return stop;
  }, []);

  const unavailable = !data || Boolean(error && !data);

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card"
      aria-label={`Clima em ${WEATHER_CITY.name}`}
    >
      {/* brilho laranja sutil no topo */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        style={{ background: "radial-gradient(120% 80% at 80% -10%, color-mix(in oklch, var(--primary) 18%, transparent), transparent 70%)" }}
      />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide">
            <span className="text-primary">
              <CloudSun className="h-4 w-4" />
            </span>
            Clima em {WEATHER_CITY.name}
          </h2>
          <button
            type="button"
            onClick={() => load(true)}
            disabled={loading}
            aria-label="Atualizar clima"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-input text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </button>
        </div>

        {unavailable ? (
          <div className="rounded-xl border border-dashed border-border bg-surface p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">{error ?? "Dados do clima temporariamente indisponíveis."}</p>
            <p className="mt-1 text-xs">
              Configure a API Climatempo no painel para exibir o tempo de {WEATHER_CITY.name}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Atual */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-primary">
                  <WeatherIcon code={data.current.code} className="h-8 w-8" />
                </span>
                <p className="font-display text-5xl font-extrabold leading-none text-gradient-brand">
                  {data.current.temperature}°
                </p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{data.current.condition}</p>
                <p>Sensação {data.current.feelsLike}°</p>
              </div>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Metric icon={<Droplets className="h-4 w-4" />} label="Umidade" value={`${data.current.humidity}%`} />
              <Metric
                icon={<Wind className="h-4 w-4" />}
                label="Vento"
                value={`${data.current.wind} km/h${data.current.windDir ? ` ${data.current.windDir}` : ""}`}
              />
            </div>

            {/* Previsão 5 dias */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Próximos 5 dias</p>
              <ul className="grid grid-cols-5 gap-2">
                {data.forecast.slice(0, 5).map((d) => (
                  <li key={d.date} className="flex flex-col items-center gap-1 rounded-lg border border-border bg-surface px-1 py-2 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{d.label}</span>
                    <span className="text-primary">
                      <WeatherIcon code={d.code} className="h-4 w-4" />
                    </span>
                    <span className="font-display text-xs font-bold">{d.high}°</span>
                    <span className="text-[10px] text-muted-foreground">{d.low}°</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="border-t border-border pt-3 text-xs text-muted-foreground">
              Atualizado às {lastUpdatedLabel(data)}
              {data.provider !== "cache" && <span> · {providerLabel(data.provider)}</span>}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
      <span className="text-primary">{icon}</span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-display text-sm font-bold">{value}</p>
      </div>
    </div>
  );
}

function providerLabel(provider: WeatherData["provider"]): string {
  if (provider === "climatempo") return "Fonte: Climatempo";
  if (provider === "open-meteo") return "Fonte: Open-Meteo";
  return "Fonte: cache local";
}
