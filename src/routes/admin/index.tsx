import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Newspaper,
  CheckCircle2,
  FileEdit,
  Eye,
  Flame,
  TrendingUp,
  PenSquare,
  Plus,
  ArrowRight,
  Rss,
  Megaphone,
  Clock,
  Database,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { demoArticles } from "@/data/demo";
import { articleLink } from "@/lib/links";
import { hasSupabaseClient } from "@/lib/news";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [{ title: "Visão geral — Painel O Laranja" }],
  }),
  component: Overview,
});

// Métricas derivadas dos dados demonstrativos (prontas para vir do Supabase).
const total = demoArticles.length + 4; // rascunhos e itens do garimpo ainda não publicados
const published = demoArticles.length;
const drafts = total - published;
const views = demoArticles.reduce((sum, a) => sum + (a.views ?? 0), 0);

const mostAccessed = [...demoArticles]
  .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
  .slice(0, 5);

const activity = [
  { action: "Notícia publicada", target: "exemplo-centro", time: "há 12 min", icon: Newspaper },
  { action: "Rascunho criado", target: "garimpo-baixa", time: "há 40 min", icon: FileEdit },
  { action: "Publicidade atualizada", target: "banner central", time: "há 2 h", icon: Megaphone },
  { action: "Fonte RSS sincronizada", target: "Agência parceira", time: "há 5 h", icon: Rss },
  { action: "Métricas consolidadas", target: "visão geral", time: "hoje", icon: TrendingUp },
];

function Overview() {
  return (
    <AdminLayout current="/admin" title="Visão geral" description="Resumo do painel do Portal O Laranja">
      {/* Indicadores */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Newspaper} label="Total de notícias" value={total} hint="no acervo" />
        <Kpi icon={CheckCircle2} label="Publicadas" value={published} hint="no ar agora" accent />
        <Kpi icon={FileEdit} label="Rascunhos" value={drafts} hint="pendentes" />
        <Kpi icon={Eye} label="Visualizações" value={views.toLocaleString("pt-BR")} hint="somatório" />
      </section>

      {/* Ações rápidas */}
      <section className="grid gap-4 md:grid-cols-3">
        <QuickAction to="/admin/criar" icon={PenSquare} title="Criar notícia" desc="Escreva e publique uma nova matéria." />
        <QuickAction to="/admin/publicadas" icon={Newspaper} title="Gerenciar notícias" desc="Edite e organize as publicações." />
        <QuickAction to="/admin/rascunhos" icon={FileEdit} title="Rascunhos" desc="Continue o que ficou pela metade." />
      </section>

      {/* Status da integração */}
      <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Database className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {hasSupabaseClient
              ? "Supabase conectado — editor gravando no banco."
              : "Supabase não conectado — usando dados locais (demo)."}
          </p>
          <p className="text-xs text-muted-foreground">
            {hasSupabaseClient
              ? "As notícias criadas entram na home e nas categorias automaticamente."
              : "Conecte a integração Supabase no painel para publicar no portal de verdade."}
          </p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Mais acessadas */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            <h2 className="font-bold">Notícias mais acessadas</h2>
          </div>
          <ol className="space-y-2">
            {mostAccessed.map((a, i) => (
              <li key={a.id}>
                <Link
                  to={articleLink(a.slug)}
                  className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent"
                >
                  <span className="font-display text-sm font-bold text-primary">{i + 1}º</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{a.title}</span>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" /> {a.views?.toLocaleString("pt-BR")}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <Link to="/admin/publicadas" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            Ver todas as notícias <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>

        {/* Últimas atividades */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="font-bold">Últimas atividades</h2>
          </div>
          <ul className="space-y-3">
            {activity.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.target + item.time} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {item.action} <span className="text-muted-foreground">• {item.target}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </AdminLayout>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: typeof Newspaper;
  label: string;
  value: number | string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div className={cn("rounded-2xl border p-5 shadow-card", accent ? "border-primary/40 bg-primary/10" : "border-border bg-card")}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className={cn("h-5 w-5", accent ? "text-primary" : "text-muted-foreground")} />
      </div>
      <p className="mt-2 font-display text-3xl font-extrabold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function QuickAction({ to, icon: Icon, title, desc }: { to: string; icon: typeof Newspaper; title: string; desc: string }) {
  return (
    <Link to={to} className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-card transition-colors hover:border-primary">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight className="ml-auto h-4 w-4 shrink-0 self-center text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
    </Link>
  );
}
