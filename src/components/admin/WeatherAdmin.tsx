// Área de gerenciamento da integração CLIMA no dashboard do Portal O Laranja.
// Configura a fonte (Climatempo com chave, ou Open-Meteo sem chave), mostra o
// estado atual da integração, os dados mais recentes de Nova Iguaçu e um
// botão para atualizar agora. Reutiliza o card público quando disponível.

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  CloudSun,
  Database,
  Loader2,
  RefreshCw,
  Settings2,
  TriangleAlert,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WeatherCard } from "@/components/portal/WeatherCard";
import {
  WEATHER_CITY,
  fetchWeather,
  hasClimatempoKey,
  lastUpdatedLabel,
  weatherStatus,
  type WeatherData,
} from "@/lib/weather";
import { saveWeatherConfig } from "@/lib/weather-server";

export function WeatherAdminRoute() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [provider, setProvider] = useState<"climatempo" | "open-meteo">(hasClimatempoKey() ? "climatempo" : "open-meteo");
  const [climatempoKey, setClimatempoKey] = useState("");

  const status = weatherStatus(data);

  async function load(force = false) {
    setLoading(true);
    try {
      const fresh = await fetchWeather(force ? { force: true } : {});
      setData(fresh);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(false);
  }, []);

  async function saveConfig() {
    setSaving(true);
    try {
      const result = await saveWeatherConfig({ provider, climatempoKey: provider === "climatempo" ? climatempoKey : "" });
      toast.success("Configuração do clima salva no backend.", {
        description: result.configured
          ? `Fonte ativa: ${result.provider === "climatempo" ? "Climatempo (chave configurada)" : "Open-Meteo (dados reais, sem chave)"}.`
          : "Mantenha a chave do Climatempo para priorizar a fonte oficial.",
      });
      if (result.provider === "climatempo" && climatempoKey) {
        // Aplica a chave para o ciclo atual (em produção, via build/ambiente).
        (import.meta as unknown as { env: Record<string, string> }).env.VITE_CLIMATEMPO_API_KEY = climatempoKey;
      }
      void load(true);
    } catch (e) {
      toast.error("Não foi possível salvar a configuração.", {
        description: e instanceof Error ? e.message : "Tente novamente.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout
      current="/admin/clima"
      title="Clima em Nova Iguaçu"
      description="Gerencie a integração meteorológica do portal."
    >
      <section className="grid gap-4 md:grid-cols-2">
        {/* Estado da integração */}
        <Card
          icon={Database}
          title="Estado da integração"
          tone={status.available ? "ok" : "warn"}
        >
          {status.available ? (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" />
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-foreground">{status.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Última atualização: {lastUpdatedLabel(data)} · Cache de 30 min · Auto-atualização a cada 1h.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 h-5 w-5 text-amber-500" />
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-foreground">{status.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  O card da home exibe a mensagem de indisponibilidade sem simular valores.
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Localização fixa */}
        <Card icon={CloudSun} title="Localização fixa" tone="neutral">
          <div className="text-sm">
            <p className="font-semibold text-foreground">{WEATHER_CITY.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Coordenadas {WEATHER_CITY.latitude.toFixed(4)}, {WEATHER_CITY.longitude.toFixed(4)} — fixas no código para
              toda a Baixada Fluminense.
            </p>
          </div>
        </Card>
      </section>

      {/* Configuração */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          <h2 className="font-bold">Fonte meteorológica</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProvider("climatempo")}
                className={
                  "rounded-lg border p-3 text-left transition-colors " +
                  (provider === "climatempo" ? "border-primary bg-primary/15" : "border-border bg-surface hover:border-primary/40")
                }
              >
                <p className="text-sm font-bold">Climatempo</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Prioridade, com chave autorizada.</p>
              </button>
              <button
                type="button"
                onClick={() => setProvider("open-meteo")}
                className={
                  "rounded-lg border p-3 text-left transition-colors " +
                  (provider === "open-meteo" ? "border-primary bg-primary/15" : "border-border bg-surface hover:border-primary/40")
                }
              >
                <p className="text-sm font-bold">Open-Meteo</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Dados reais, sem chave.</p>
              </button>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weather-key">Chave da API Climatempo</Label>
              <Input
                id="weather-key"
                type="password"
                value={climatempoKey}
                onChange={(e) => setClimatempoKey(e.target.value)}
                disabled={provider !== "climatempo"}
                placeholder="user_token do Climatempo (somente backend)"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                A chave é enviada ao backend e nunca exibida no painel. Também pode ser injetada no build por
                <code className="mx-1 rounded bg-surface px-1">VITE_CLIMATEMPO_API_KEY</code>.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="hero" size="sm" onClick={saveConfig} disabled={saving}>
                {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}
                Salvar configuração
              </Button>
              <Button variant="outline" size="sm" onClick={() => void load(true)} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                )}
                Atualizar agora
              </Button>
            </div>
          </div>

          {/* Prévia do card */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Prévia do card na home
            </p>
            <WeatherCard />
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-card">
        <h3 className="mb-2 font-bold text-foreground">Como a integração funciona</h3>
        <ul className="list-disc space-y-1 pl-5 text-xs">
          <li>Localização fixa em {WEATHER_CITY.name}, {WEATHER_CITY.uf} — sem dados fictícios.</li>
          <li>Com chave, consulta a API Climatempo; em falha, usa Open-Meteo (dados reais).</li>
          <li>Cache local de 30 min e auto-atualização a cada 1h (e ao focar a aba).</li>
          <li>Se a API não estiver configurada, o card informa que os dados estão temporariamente indisponíveis.</li>
        </ul>
      </section>
    </AdminLayout>
  );
}

function Card({
  icon: Icon,
  title,
  tone,
  children,
}: {
  icon: typeof Database;
  title: string;
  tone: "ok" | "warn" | "neutral";
  children: React.ReactNode;
}) {
  const ring =
    tone === "ok" ? "border-emerald-500/30" : tone === "warn" ? "border-amber-500/30" : "border-border";
  return (
    <div className={"rounded-2xl border bg-card p-5 shadow-card " + ring}>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="text-sm font-extrabold uppercase tracking-wide">{title}</h2>
      </div>
      {children}
    </div>
  );
}
