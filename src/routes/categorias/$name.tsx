import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/portal/PageLayout";
import { CategoryPage, useCategoryArticles } from "@/components/portal/CategoryPage";

export const Route = createFileRoute("/categorias/$name")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.name} — Portal O Laranja` },
      { name: "description", content: `Últimas notícias de ${params.name} no Portal O Laranja.` },
      { property: "og:title", content: `${params.name} — Portal O Laranja` },
    ],
  }),
  component: CategoryPageView,
});

function CategoryPageView() {
  const { name } = Route.useParams();
  const { name: resolved, articles } = useCategoryArticles(name);
  return <CategoryPage name={resolved} articles={articles} />;
}

export { useCategoryArticles };
