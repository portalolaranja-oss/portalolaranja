import { createFileRoute } from "@tanstack/react-router";
import { MetaSocialRoute } from "@/components/admin/MetaSocial";

export const Route = createFileRoute("/admin/redes")({
  head: () => ({
    meta: [{ title: "Redes sociais — Painel O Laranja" }],
  }),
  component: MetaSocialRoute,
});
