import { createFileRoute } from "@tanstack/react-router";
import { WeatherAdminRoute } from "@/components/admin/WeatherAdmin";

export const Route = createFileRoute("/admin/clima")({
  head: () => ({
    meta: [{ title: "Clima — Painel O Laranja" }],
  }),
  component: WeatherAdminRoute,
});
