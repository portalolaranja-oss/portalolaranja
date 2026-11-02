import { Fragment } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/portal/SiteHeader";
import { SiteFooter } from "@/components/portal/SiteFooter";
import { BreakingTicker, SectionTitle } from "@/components/portal/SectionTitle";
import { MainHeadline, SecondaryHeadline } from "@/components/portal/Headlines";
import { FeedPost } from "@/components/portal/FeedPost";
import { AdBanner } from "@/components/portal/AdBanner";
import { LatestWidget, LotteryWidget, MostReadWidget, SportsWidget, WeatherWidget } from "@/components/portal/Widgets";
import { Button } from "@/components/ui/button";
import { brand } from "@/lib/brand";
import { demoAds, demoArticles } from "@/data/demo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Portal O Laranja — Notícias de Nova Iguaçu e Baixada" },
      { name: "description", content: "A notícia da nossa cidade! Nova Iguaçu, Baixada Fluminense, Rio de Janeiro, política, polícia, esportes e entretenimento." },
      { property: "og:title", content: "Portal O Laranja — Notícias de Nova Iguaçu e Baixada" },
      { property: "og:description", content: "A notícia da nossa cidade! Nova Iguaçu, Baixada Fluminense e Rio de Janeiro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const AD_AFTER = 2; // posição do banner central no feed

function Index() {
  const [main, sec1, sec2, ...feed] = demoArticles;
  return (
    <div className="min-h-screen">
      <BreakingTicker items={demoArticles.slice(0, 4).map((a) => a.title)} />
      <SiteHeader />

      <main className="container-portal space-y-12 py-6 md:py-8">
        <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {main && <MainHeadline article={main} />}
          <div className="grid gap-4 sm:grid-cols-2 lg:flex lg:flex-col">
            {sec1 && <SecondaryHeadline article={sec1} />}
            {sec2 && <SecondaryHeadline article={sec2} />}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section>
            <SectionTitle>Feed de notícias</SectionTitle>
            <div className="mx-auto max-w-2xl space-y-6 lg:mx-0">
              <div className="lg:hidden"><WeatherWidget /></div>
              {feed.map((a, i) => (
                <Fragment key={a.id}>
                  <FeedPost article={a} />
                  {i === AD_AFTER - 1 && <AdBanner ad={demoAds.central} />}
                </Fragment>
              ))}
            </div>
          </section>

          <aside className="space-y-6 lg:sticky lg:top-40 lg:self-start">
            <div className="hidden lg:block"><WeatherWidget /></div>
            <MostReadWidget articles={demoArticles} />
            <div className="hidden lg:block"><LatestWidget articles={demoArticles} /></div>
            <AdBanner ad={demoAds.sidebar} variant="square" />
          </aside>
        </div>

        <section>
          <SectionTitle>Serviços</SectionTitle>
          <div className="grid gap-6 md:grid-cols-3">
            <WeatherWidget />
            <LotteryWidget />
            <SportsWidget />
          </div>
        </section>

        <section className="relative overflow-hidden rounded-2xl border border-border bg-ink shadow-card">
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
            <img src={brand.mascote} alt="Mascote Repórter Laranja" loading="lazy" className="mx-auto h-72 w-auto md:h-96" />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
