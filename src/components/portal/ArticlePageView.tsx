import { Link } from "@tanstack/react-router";
import { demoArticles } from "@/data/demo";
import { PageLayout } from "@/components/portal/PageLayout";
import { ArticlePageContent } from "@/components/portal/ArticlePage";

/**
 * Página individual de notícia (slug dinâmico).
 * Reaproveita o layout e o conteúdo do artigo já criados.
 */
export function ArticlePageView({ slug }: { slug: string }) {
  const article = demoArticles.find((a) => a.slug === slug);
  if (!article) return <ArticleNotFound slug={slug} />;
  return (
    <PageLayout breadcrumb={`Home › ${article.category}`}>
      <ArticlePageContent article={article} all={demoArticles} />
    </PageLayout>
  );
}

function ArticleNotFound({ slug }: { slug: string }) {
  return (
    <PageLayout breadcrumb="Home">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-4xl font-extrabold text-gradient-brand">404</h1>
        <p className="mt-3 text-muted-foreground">
          Não encontramos a notícia <strong className="text-foreground">{slug}</strong>. Ela pode ter sido movida ou removida.
        </p>
        <Link to="/" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">
          Voltar para a home
        </Link>
      </div>
    </PageLayout>
  );
}
