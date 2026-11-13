import { createFileRoute } from "@tanstack/react-router";
import { SearchPage } from "@/components/portal/SearchPage";

export const Route = createFileRoute("/pesquisa")({
  validateSearch: (s) => ({
    q: typeof s.q === "string" ? s.q : undefined,
    categoria: typeof s.categoria === "string" ? s.categoria : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Pesquisa — Portal O Laranja" },
      { name: "description", content: "Busque notícias no Portal O Laranja por título, palavra-chave ou categoria." },
    ],
  }),
  component: SearchPage,
});
