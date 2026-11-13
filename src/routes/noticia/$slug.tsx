import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageLayout } from "@/components/portal/PageLayout";
import { ArticlePageView } from "@/components/portal/ArticlePageView";
import { getArticleBySlug, toArticle, type ArticleFormData } from "@/lib/news";

export const Route = createFileRoute("/noticia/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Notícia — Portal O Laranja` },
      { name: "description", content: "Leia a notícia completa no Portal O Laranja." },
      { property: "og:type", content: "article" },
      { property: "og:title", content: `Notícia — Portal O Laranja` },
      { property: "og:description", content: "Leia a notícia completa no Portal O Laranja." },
    ],
  }),
  component: ArticleRouteView,
});

function ArticleRouteView() {
  const { slug } = Route.useParams();
  const [seo, setSeo] = useState<ArticleFormData | null>(null);

  // Enriquece as meta tags (og / SEO) com os dados reais da notícia publicada.
  useEffect(() => {
    let active = true;
    getArticleBySlug(slug).then((a) => {
      if (active && a) setSeo(toArticle(a));
    });
    return () => {
      active = false;
    };
  }, [slug]);

  // Título/descrição otimizados para SEO (usa seo_title/seo_description quando houver).
  useEffect(() => {
    if (seo && document) {
      document.title = seo.seo.title || document.title;
      const desc = document.querySelector('meta[name="description"]');
      if (desc) desc.setAttribute("content", seo.seo.description || seo.subtitle);
    }
  }, [seo]);

  return <ArticlePageView slug={slug} />;
}
