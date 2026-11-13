import { useState, useEffect } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { demoArticles, type Article } from "@/data/demo";
import { getPortalArticles } from "@/lib/news";
import { PageLayout } from "@/components/portal/PageLayout";
import { SectionTitle } from "@/components/portal/SectionTitle";
import { AdBanner } from "@/components/portal/AdBanner";
import { CategoryTag } from "@/components/portal/NewsCard";
import { articleLink, categoryPath } from "@/lib/links";

export function SearchPage() {
  const search = useSearch({ from: "/pesquisa" }) as { q?: string; categoria?: string };
  const [q, setQ] = useState(search.q ?? "");
  const [categoria, setCategoria] = useState(search.categoria ?? "");
  const [submitted, setSubmitted] = useState<{ q: string; categoria: string }>({ q: search.q ?? "", categoria: search.categoria ?? "" });
  const [articles, setArticles] = useState<Article[]>(demoArticles);

  // Usa as publicadas (Supabase + demo) quando disponíveis.
  useEffect(() => {
    let active = true;
    getPortalArticles().then((list) => {
      if (active && list.length) setArticles(list);
    });
    return () => {
      active = false;
    };
  }, []);

  const categories = Array.from(new Set(articles.map((a) => a.category)));

  const query = submitted.q.trim().toLowerCase();
  const cat = submitted.categoria;
  const results = articles.filter((a) => {
    const matchesCat = cat ? a.category.toLowerCase() === cat.toLowerCase() : true;
    if (!matchesCat) return false;
    if (!query) return true;
    const haystack = [a.title, a.excerpt, a.category, ...(a.body ?? [])].join(" ").toLowerCase();
    return query.split(/\s+/).some((word) => word.length > 1 && haystack.includes(word));
  });

  const submit = () => setSubmitted({ q, categoria });

  return (
    <PageLayout breadcrumb="Home › Pesquisa">
      <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-card md:p-8">
        <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">Busca</p>
        <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">Encontre notícias no Portal O Laranja</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pesquise por título, palavra-chave ou categoria.</p>

        <form
          className="mt-6 flex flex-col gap-3 md:flex-row md:items-center"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Digite o título ou uma palavra-chave…"
              aria-label="Palavra-chave"
              className="h-11 pl-10"
            />
          </div>
          <Select value={categoria} onValueChange={(v) => setCategoria(v ?? "")}>
            <SelectTrigger className="w-full md:w-56" aria-label="Categoria">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" size="lg" className="h-11">
            <Search /> Buscar
          </Button>
        </form>
      </div>

      <SectionTitle>
        {results.length} {results.length === 1 ? "resultado" : "resultados"}
        {query && <> para <strong className="text-primary">&ldquo;{submitted.q}&rdquo;</strong></>}
      </SectionTitle>

      {results.length === 0 ? (
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-10 text-center shadow-card">
          <Search className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-extrabold">Nada encontrado</h2>
          <p className="mt-2 text-sm text-muted-foreground">Tente outros termos ou navegue pelas <Link to="/categorias/nova-iguacu" className="font-semibold text-primary hover:underline">categorias</Link>.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((a) => (
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
                <p className="line-clamp-2 text-sm text-muted-foreground">{a.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10">
        <AdBanner ad={{ id: "ad-search", advertiser: "Espaço publicitário", title: "Anuncie na busca do Portal O Laranja", href: "#" }} />
      </div>
    </PageLayout>
  );
}
