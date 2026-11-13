import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SocialTemplatesPanel } from "@/components/admin/templates/SocialTemplates";
import { getNewsById, getNewsList } from "@/lib/news";
import { takePendingArticle } from "@/lib/template-handoff";
import { demoArticles, type Article } from "@/data/demo";

export const Route = createFileRoute("/admin/templates")({
  head: () => ({
    meta: [{ title: "Templates sociais — Painel O Laranja" }],
  }),
  component: Templates,
});

function Templates() {
  // 1º: handoff do editor (se veio de "Gerar artes")
  // 2º: senão, a notícia mais recente da lista
  const [article, setArticle] = useState<Article | null>(() => takePendingArticle());
  const [loading, setLoading] = useState(!article);

  useEffect(() => {
    if (article) return;
    let alive = true;
    void (async () => {
      const list = await getNewsList();
      if (!alive) return;
      // Sem banco (fallback local): usa o acervo demo para não deixar o
      // gerador sem notícia selecionada.
      const items: { id: string; slug: string; title: string; category: string; author: string; updatedAt: string }[] =
        list.length
          ? list.map((n) => ({
              id: n.id,
              slug: n.slug,
              title: n.title,
              category: n.category,
              author: n.author,
              updatedAt: n.updatedAt,
            }))
          : demoArticles.map((a) => ({
              id: a.id,
              slug: a.slug,
              title: a.title,
              category: a.category,
              author: a.author,
              updatedAt: a.publishedAt,
            }));
      if (!items.length) {
        setLoading(false);
        return;
      }
      const first = items[0];
      const local = demoArticles.find((a) => a.id === first.id || a.slug === first.slug);
      const data = local ? null : await getNewsById(first.id);
      if (!alive) return;
      const a: Article = data
        ? {
            id: first.id,
            slug: first.slug,
            category: data.category || first.category,
            title: data.title,
            subtitle: data.subtitle,
            excerpt: data.subtitle,
            body: [],
            image: data.coverImage,
            publishedAt: new Date().toISOString(),
            author: data.author,
          }
        : local
          ? local
          : {
              id: first.id,
              slug: first.slug,
              category: first.category,
              title: first.title,
              excerpt: "",
              body: [],
              image: "",
              publishedAt: first.updatedAt || new Date().toISOString(),
              author: first.author,
            };
      setArticle(a);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [article]);

  if (loading) {
    return (
      <AdminLayout current="/admin/templates" title="Templates sociais" description="Modelos para redes sociais.">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando notícias…
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout current="/admin/templates" title="Templates sociais" description="Gerador de artes para Instagram e Facebook a partir das notícias.">
      <SocialTemplatesPanel initialArticle={article ?? undefined} />
    </AdminLayout>
  );
}
