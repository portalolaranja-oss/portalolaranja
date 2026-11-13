// Caminhos de link das notícias (mantém os componentes reutilizáveis; só troca os dados do demo pelas URLs reais).
import { type Article } from "@/data/demo";

export function articleLink(slug: string) {
  return `/noticia/${slug}`;
}

export function articleLinkTo(article: Pick<Article, "slug">) {
  return articleLink(article.slug);
}

export function categoryPath(name: string) {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return `/categorias/${slug}`;
}
