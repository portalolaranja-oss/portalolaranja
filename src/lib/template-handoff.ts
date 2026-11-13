// Canal de handoff entre o editor de notícias e o Gerador de Templates.
// O editor chama `setPendingArticle` antes de navegar; o painel lê e limpa.
// Fica em memória (não é fonte de verdade — a notícia real continua no
// banco/Supabase). Evita duplicar a tabela `news`.

import type { Article } from "@/data/demo";

let pending: Article | null = null;

export function setPendingArticle(article: Article | null) {
  pending = article;
}

export function takePendingArticle(): Article | null {
  const out = pending;
  pending = null;
  return out;
}
