import { CloudSun, Ticket, Trophy } from "lucide-react";
import { demoLottery, demoMatches, demoWeather, formatDate, type Article } from "@/data/demo";

function DemoBadge() {
  return <span className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Exemplo</span>;
}

export function Widget({ title, icon, demo, children }: { title: string; icon?: React.ReactNode; demo?: boolean; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide">
          <span className="text-primary">{icon}</span>{title}
        </h2>
        {demo && <DemoBadge />}
      </div>
      {children}
    </section>
  );
}

export function WeatherWidget() {
  const w = demoWeather;
  return (
    <Widget title={`Clima em ${w.city}`} icon={<CloudSun className="h-4 w-4" />} demo>
      <div className="flex items-center justify-between">
        <p className="font-display text-5xl font-extrabold text-gradient-brand">{w.temp}°</p>
        <div className="text-right text-sm text-muted-foreground">
          <p>{w.condition}</p>
          <p>Mín {w.min}° · Máx {w.max}°</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Dados ilustrativos. Previsão real em breve.</p>
    </Widget>
  );
}

export function LotteryWidget() {
  return (
    <Widget title="Loterias" icon={<Ticket className="h-4 w-4" />} demo>
      <div className="space-y-4">
        {demoLottery.map((l) => (
          <div key={l.name}>
            <p className="mb-2 text-sm font-semibold">{l.name} <span className="text-muted-foreground">· concurso de exemplo</span></p>
            <div className="flex flex-wrap gap-1.5">
              {l.numbers.map((n) => (
                <span key={n} className="grid h-8 w-8 place-items-center rounded-full bg-accent font-display text-sm font-bold text-accent-foreground">{String(n).padStart(2, "0")}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Widget>
  );
}

export function SportsWidget() {
  return (
    <Widget title="Esportes do Rio" icon={<Trophy className="h-4 w-4" />} demo>
      <ul className="divide-y divide-border">
        {demoMatches.map((m) => (
          <li key={m.home} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 py-3 text-sm">
            <span className="truncate font-semibold">{m.home}</span>
            <span className="text-center"><span className="block font-display font-extrabold text-primary">{m.score}</span><span className="text-[10px] text-muted-foreground">{m.info}</span></span>
            <span className="truncate text-right font-semibold">{m.away}</span>
          </li>
        ))}
      </ul>
    </Widget>
  );
}

export function MostReadWidget({ articles }: { articles: Article[] }) {
  const sorted = [...articles].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 5);
  return (
    <Widget title="Mais lidas">
      <ol className="space-y-4">
        {sorted.map((a, i) => (
          <li key={a.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
            <span className="font-display text-3xl font-extrabold leading-none text-gradient-brand">{i + 1}</span>
            <a href="#" className="line-clamp-3 text-sm font-semibold leading-snug hover:text-primary">{a.title}</a>
          </li>
        ))}
      </ol>
    </Widget>
  );
}

export function LatestWidget({ articles }: { articles: Article[] }) {
  return (
    <Widget title="Últimas notícias">
      <ul className="space-y-3">
        {articles.slice(0, 5).map((a) => (
          <li key={a.id} className="border-l-2 border-primary pl-3">
            <time className="text-xs text-muted-foreground">{formatDate(a.publishedAt)}</time>
            <a href="#" className="line-clamp-2 text-sm font-semibold hover:text-primary">{a.title}</a>
          </li>
        ))}
      </ul>
    </Widget>
  );
}
