import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { demoArticles, type Article } from "@/data/demo";
import { getArticleBySlug } from "@/lib/news";
import { PageLayout } from "@/components/portal/PageLayout";
import { ArticlePageContent } from "@/components/portal/ArticlePage";

/**
 * Página individual de notícia (slug dinâmico).
 * Busca a notícia publicada no Supabase (ou demo/local) e reaproveita o
 * layout e o conteúdo do artigo já criados.
 */
export function ArticlePageView({ slug }: { slug: string }) {
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<Article[]>(demoArticles);

  useEffect(() => {
    let active = true;
    getArticleBySlug(slug).then((a) => {
      if (!active) return;
      setArticle(a);
      setLoading(false);
    });
    // Notícias relacionadas: pega as demais publicadas (ou demo).
    import("@/lib/news")
      .then((m) => m.getPortalArticles())
      .then((all) => {
        if (active && all.length) setRelated(all);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <PageLayout breadcrumb={`Home › Notícia`}>
        <div className="mx-auto max-w-md text-center">
          <p className="text-sm text-muted-foreground">Carregando notícia…</p>
        </div>
      </PageLayout>
    );
  }

  if (!article) return <ArticleNotFound slug={slug} onNavigate={() => navigate({ to: "/" })} />;

  return (
    <PageLayout breadcrumb={`Home › ${article.category}`}>
      <ArticlePageContent article={article} all={related} />
    </PageLayout>
  );
}

function ArticleNotFound({ slug, onNavigate }: { slug: string; onNavigate: () => void }) {
  return (
    <PageLayout breadcrumb="Home">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-4xl font-extrabold text-gradient-brand">404</h1>
        <p className="mt-3 text-muted-foreground">
          Não encontramos a notícia <strong className="text-foreground">{slug}</strong>. Ela pode ter sido movida ou removida.
        </p>
        <button type="button" onClick={onNavigate} className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">
          Voltar para a home
        </button>
      </div>
    </PageLayout>
  );
}
