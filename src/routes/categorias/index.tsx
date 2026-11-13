import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { BrandPage } from "@/components/portal/BrandPage";
import { AdBanner } from "@/components/portal/AdBanner";
import { demoArticles } from "@/data/demo";

export const Route = createFileRoute("/categorias")({
  head: () => ({
    meta: [
      { title: "Categorias — Portal O Laranja" },
      { name: "description", content: "Navegue pelas editorias do Portal O Laranja: Nova Iguaçu, Baixada Fluminense, Rio de Janeiro, Polícia, Política, Esportes e Entretenimento." },
    ],
  }),
  component: CategoriesIndex,
});

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "Nova Iguaçu": "Cobertura local da cidade: administração, serviços, mobilidade e a rotina do dia a dia.",
  "Baixada Fluminense": "Notícias que impactam toda a Baixada: transporte, saúde, educação e segurança.",
  "Rio de Janeiro": "Pauta estadual: governo, grandes obras e o impacto no cotidiano do fluminense.",
  "Polícia": "Bastidores da segurança pública, operações e boletins de ocorrência.",
  "Política": "Análises e reportagens sobre política local, estadual e federal.",
  "Esportes": "Times da região, competições e o calendário esportivo do Rio e da Baixada.",
  "Entretenimento": "Shows, festivais e a cena cultural da Baixada Fluminense.",
};

function CategoriesIndex() {
  const seen = new Set<string>();
  const categories = demoArticles.map((a) => a.category).filter((c) => (seen.has(c) ? false : (seen.add(c), true)));

  return (
    <BrandPage>
      <div className="mb-8">
        <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">Editorias</p>
        <h1 className="text-3xl font-extrabold md:text-4xl">Todas as categorias</h1>
        <p className="mt-1 text-sm text-muted-foreground">Escolha uma editoria para conferir as reportagens mais recentes.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <Link
            key={c}
            to={`/categorias/${encodeURIComponent(c)}`}
            className="group rounded-xl border border-border bg-card p-6 shadow-card transition-colors hover:border-primary/50"
          >
            <h2 className="text-xl font-extrabold transition-colors group-hover:text-primary">{c}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{CATEGORY_DESCRIPTIONS[c] ?? "As últimas reportagens da editoria."}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <AdBanner ad={{ id: "ad-cat-index", advertiser: "Espaço publicitário", title: "Anuncie em todas as editorias", href: "#" }} />
      </div>
    </BrandPage>
  );
}
