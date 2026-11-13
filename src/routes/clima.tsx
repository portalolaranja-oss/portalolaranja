import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { WeatherCard } from "@/components/portal/WeatherCard";
import { SiteFooter } from "@/components/portal/SiteFooter";
import { SiteHeader } from "@/components/portal/SiteHeader";
import { WEATHER_CITY } from "@/lib/weather";

export const Route = createFileRoute("/clima")({
  head: () => ({
    meta: [{ title: "Clima em Nova Iguaçu — Portal O Laranja" }],
  }),
  component: WeatherPage,
});

function WeatherPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container-portal space-y-8 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold md:text-3xl">
            Clima em {WEATHER_CITY.name}
          </h1>
          <Link to="/" className="text-sm font-semibold text-primary hover:underline">
            ← Voltar à home
          </Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <WeatherCard />
          <section className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-card">
            <h2 className="mb-2 font-bold text-foreground">Sobre esta página</h2>
            <p>
              O card de clima de {WEATHER_CITY.name} está disponível na home do portal e nesta página. Os dados
              vêm de uma API meteorológica real (Climatempo quando configurada, ou Open-Meteo) — nunca de valores
              fictícios. A equipe configura a integração no painel do portal.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
