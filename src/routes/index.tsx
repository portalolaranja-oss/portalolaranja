import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/portal/SiteHeader";
import { SiteFooter } from "@/components/portal/SiteFooter";
import { NewsCard } from "@/components/portal/NewsCard";
import { BreakingTicker, SectionTitle } from "@/components/portal/SectionTitle";
import { Button } from "@/components/ui/button";
import { brand } from "@/lib/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Portal O Laranja — Notícias de Nova Iguaçu" },
      { name: "description", content: "A notícia da nossa cidade! Notícias de Nova Iguaçu e Baixada Fluminense." },
      { property: "og:title", content: "Portal O Laranja — Notícias de Nova Iguaçu" },
      { property: "og:description", content: "A notícia da nossa cidade! Notícias de Nova Iguaçu e Baixada Fluminense." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

// Conteúdo de exemplo apenas para demonstrar a estrutura visual.
const sample = [
  { category: "Cidade", title: "Exemplo de manchete: obras na Via Light avançam no centro", time: "Há 1 hora" },
  { category: "Esportes", title: "Exemplo de manchete: Nova Iguaçu FC se prepara para a próxima rodada", time: "Há 2 horas" },
  { category: "Cultura", title: "Exemplo de manchete: agenda cultural do fim de semana", time: "Há 3 horas" },
  { category: "Saúde", title: "Exemplo de manchete: campanha de vacinação nos postos do município", time: "Há 4 horas" },
];

function Index() {
  return (
    <div className="min-h-screen">
      <BreakingTicker items={["Espaço reservado para notícias urgentes", "Estrutura visual do Portal O Laranja", "Nova Iguaçu • RJ"]} />
      <SiteHeader />

      <main className="container-portal space-y-14 py-8">
        <section className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <NewsCard layout="featured" live category="Ao vivo" title="Espaço da manchete principal do Portal O Laranja" excerpt="Chamada de destaque com imagem em tela cheia, ideal para a notícia mais importante do dia." time="Agora" />
          <div className="flex flex-col gap-4">
            {sample.slice(0, 3).map((n) => <NewsCard key={n.title} layout="horizontal" {...n} />)}
          </div>
        </section>

        <section>
          <SectionTitle action={<Button variant="link" size="sm">Ver tudo</Button>}>Últimas notícias</SectionTitle>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {sample.map((n) => <NewsCard key={n.title} {...n} excerpt="Resumo curto da notícia para orientar a leitura." />)}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="space-y-4 p-8 md:p-12">
              <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">{brand.city}</p>
              <h2 className="text-3xl font-extrabold md:text-4xl">
                Viu algo na cidade? <span className="text-gradient-brand">Conta pro Laranja.</span>
              </h2>
              <p className="max-w-lg text-muted-foreground">Seu canal direto com a redação. Envie fotos, vídeos e informações.</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="hero" size="lg">Enviar notícia</Button>
                <Button variant="outline" size="lg">Quem somos</Button>
              </div>
            </div>
            <img src={brand.mascote} alt="Mascote Repórter Laranja" className="mx-auto h-72 w-auto md:h-96" />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
