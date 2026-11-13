import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/portal/PageLayout";
import { ArticlePageView } from "@/components/portal/ArticlePageView";
import { demoArticles } from "@/data/demo";

export const Route = createFileRoute("/noticia/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Notícia — Portal O Laranja` },
      { name: "description", content: "Leia a notícia completa no Portal O Laranja." },
      { property: "og:type", content: "article" },
      { property: "og:title", content: demoArticles.find((a) => a.slug === params.slug)?.title ?? "Notícia — Portal O Laranja" },
      { property: "og:description", content: demoArticles.find((a) => a.slug === params.slug)?.excerpt ?? "Leia a notícia completa no Portal O Laranja." },
      { property: "og:image", content: demoArticles.find((a) => a.slug === params.slug)?.image ?? "" },
    ],
  }),
  component: ArticleRouteView,
});

function ArticleRouteView() {
  const { slug } = Route.useParams();
  const article = demoArticles.find((a) => a.slug === slug);
  if (!article) {
    return (
      <PageLayout breadcrumb="Home">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-4xl font-extrabold text-gradient-brand">404</h1>
          <p className="mt-3 text-muted-foreground">
            Não encontramos a notícia <strong className="text-foreground">{slug}</strong>. Ela pode ter sido movida ou removida.
          </p>
        </div>
      </PageLayout>
    );
  }
  return <ArticlePageView slug={slug} />;
}
