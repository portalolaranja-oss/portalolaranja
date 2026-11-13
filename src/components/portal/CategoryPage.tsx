import { Link } from "@tanstack/react-router";
import { demoArticles, type Article } from "@/data/demo";
import { articleLink, categoryPath } from "@/lib/links";
import { SearchX, Newspaper } from "lucide-react";
import { PageLayout } from "@/components/portal/PageLayout";
import { SectionTitle } from "@/components/portal/SectionTitle";
import { AdBanner } from "@/components/portal/AdBanner";
import { CategoryTag } from "@/components/portal/NewsCard";
import { Button } from "@/components/ui/button";

export function CategoryPage({ name, articles }: { name: string; articles: Article[] }) {
  if (articles.length === 0) {
    return (
      <PageLayout breadcrumb={`Home › ${name}`}>
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-10 text-center shadow-card">
          <SearchX className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-extrabold">Nenhuma notícia encontrada</h1>
          <p className="mt-2 text-muted-foreground">
            Ainda não publicamos matérias na categoria <strong className="text-foreground">{name}</strong>. Volte em breve ou confira as demais reportagens do portal.
          </p>
          <Button asChild variant="hero" className="mt-6">
            <Link to="/">Ver todas as notícias</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  const [featured, ...rest] = articles;

  return (
    <PageLayout breadcrumb={`Home › ${name}`}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">Cobertura</p>
          <h1 className="text-3xl font-extrabold md:text-4xl">{name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{articles.length} notícias publicadas</p>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Link
          to={articleLink(featured.slug)}
          className="group relative min-h-[24rem] overflow-hidden rounded-2xl border border-border shadow-card md:min-h-[30rem]"
        >
          <img src={featured.image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-fade" />
          <div className="relative flex h-full min-h-[inherit] flex-col justify-end gap-3 p-6 md:p-10">
            <CategoryTag solid>{featured.category}</CategoryTag>
            <h2 className="text-3xl font-extrabold leading-tight md:text-4xl">{featured.title}</h2>
            <p className="max-w-2xl text-base text-muted-foreground md:text-lg">{featured.excerpt}</p>
          </div>
        </Link>
        <div className="grid gap-4 sm:grid-cols-2 lg:flex lg:flex-col">
          {rest.slice(0, 2).map((a) => (
            <Link key={a.id} to={articleLink(a.slug)} className="group relative block min-h-[12rem] flex-1 overflow-hidden rounded-2xl border border-border shadow-card transition-colors hover:border-primary/50">
              <img src={a.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-fade" />
              <div className="relative flex h-full min-h-[inherit] flex-col justify-end gap-2 p-5">
                <CategoryTag solid>{a.category}</CategoryTag>
                <h3 className="text-lg font-extrabold leading-snug transition-colors group-hover:text-primary">{a.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {rest.length > 2 && (
        <section className="mt-10">
          <SectionTitle>Mais notícias de {name}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.slice(2).map((a) => (
              <Link
                key={a.id}
                to={articleLink(a.slug)}
                className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition-colors hover:border-primary/50"
              >
                <div className="aspect-video overflow-hidden">
                  <img src={a.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="space-y-1.5 p-4">
                  <CategoryTag>{a.category}</CategoryTag>
                  <h3 className="line-clamp-3 font-display font-bold leading-snug group-hover:text-primary">{a.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10">
        <AdBanner ad={{ id: "ad-cat", advertiser: "Espaço publicitário", title: "Sua marca aqui — fale com toda a Baixada", href: "#" }} />
      </div>
    </PageLayout>
  );
}

function stripAccents(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/-/g, " ").trim().toLowerCase();
}

export function useCategoryArticles(raw: string): { name: string; articles: Article[] } {
  const norm = raw.trim().toLowerCase();
  const exact = demoArticles.find((a) => a.category.toLowerCase() === norm);
  if (exact) return { name: exact.category, articles: demoArticles.filter((a) => a.category === exact.category) };

  const slug = norm.replace(/-/g, " ");
  const slugNorm = stripAccents(slug);
  const fuzzy = demoArticles.find((a) => {
    const cat = stripAccents(a.category);
    return cat === slugNorm || cat.includes(slugNorm) || slugNorm.includes(cat);
  });
  if (fuzzy) return { name: fuzzy.category, articles: demoArticles.filter((a) => a.category === fuzzy.category) };

  const pretty = raw.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return { name: pretty, articles: [] };
}
