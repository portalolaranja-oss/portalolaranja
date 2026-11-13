import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, MessageCircle, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brand } from "@/lib/brand";
import { type Article, formatDate } from "@/data/demo";
import { articleLink } from "@/lib/links";
import { AdBanner } from "@/components/portal/AdBanner";
import { CategoryTag } from "@/components/portal/NewsCard";
import { toast } from "sonner";

interface ShareLinks {
  article: Article;
}

function buildShareLinks({ article }: ShareLinks) {
  const url = typeof window !== "undefined" ? window.location.href : articleLink(article.slug);
  const text = `${article.title} — Portal O Laranja`;
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    instagram: brand.social.instagram, // "quando aplicável"
    url,
  };
}

export function ShareButtons({ article }: { article: Article }) {
  const links = buildShareLinks({ article });
  const copyLink = async () => {
    try {
      await navigator.clipboard?.writeText(links.url);
      toast.success("Link copiado para a área de transferência.");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Compartilhar</span>
      <a
        href={links.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-[#25D366] hover:text-[#25D366]"
        aria-label="Compartilhar no WhatsApp"
      >
        <MessageCircle className="h-4 w-4" />
      </a>
      <a
        href={links.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-[#1877F2] hover:text-[#1877F2]"
        aria-label="Compartilhar no Facebook"
      >
        <Facebook className="h-4 w-4" />
      </a>
      <a
        href={links.instagram}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-[#E4405F] hover:text-[#E4405F]"
        aria-label="Compartilhar no Instagram"
      >
        <Instagram className="h-4 w-4" />
      </a>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary hover:text-primary"
        aria-label="Copiar link da notícia"
      >
        <Share className="h-4 w-4" />
      </button>
    </div>
  );
}

export function RelatedArticles({ articles, current }: { articles: Article[]; current: Article }) {
  const related = articles.filter((a) => a.category === current.category && a.id !== current.id).slice(0, 3);
  if (related.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="mb-4 flex items-center gap-3 border-b border-border pb-3 text-xl font-extrabold uppercase md:text-2xl">
        <span className="h-6 w-1.5 rounded-full bg-gradient-brand" />
        Notícias relacionadas
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((a) => (
          <Link
            key={a.id}
            to={articleLink(a.slug)}
            className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition-colors hover:border-primary/50"
          >
            <div className="aspect-video overflow-hidden">
              <img src={a.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="space-y-1.5 p-4">
              <CategoryTag>{a.category}</CategoryTag>
              <h3 className="line-clamp-3 font-display font-bold leading-snug group-hover:text-primary">{a.title}</h3>
              <time className="text-xs text-muted-foreground">{formatDate(a.publishedAt)}</time>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ArticlePageContent({ article, all }: { article: Article; all: Article[] }) {
  const body =
    article.body && article.body.length
      ? article.body
      : [
          article.excerpt,
          "Esta é a versão demonstrativa do texto da notícia, preparada para exibir a estrutura da página de artigo. Quando o portal for conectado ao banco de dados, este conteúdo será substituído pelo texto completo publicado na redação.",
          "O Portal O Laranja segue de perto as notícias de Nova Iguaçu, da Baixada Fluminense e do Rio de Janeiro, com equipe de plantão e apuração responsável em todas as redações. Esta matéria de exemplo representa o espaço em que o conteúdo real entrará nesta etapa do desenvolvimento.",
        ];

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <CategoryTag solid>{article.category}</CategoryTag>
          <time className="text-sm text-muted-foreground">{formatDate(article.publishedAt)}</time>
        </div>
        <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">{article.title}</h1>
        <p className="text-lg text-muted-foreground">{article.excerpt}</p>
        <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border py-3 text-sm">
          <span className="font-semibold">Por {article.author}</span>
          <ShareButtons article={article} />
        </div>
      </header>

      <figure className="mb-8 overflow-hidden rounded-2xl border border-border shadow-card">
        <img src={article.image} alt={article.title} className="aspect-video w-full object-cover" />
        <figcaption className="px-4 py-2 text-xs text-muted-foreground">Foto: {article.author} / Portal O Laranja</figcaption>
      </figure>

      <div className="space-y-5 text-base leading-7 md:text-lg md:leading-8">
        {body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div className="my-10">
        <AdBanner ad={{ id: "ad-article", advertiser: "Espaço publicitário", title: "Sua marca aqui — anuncie no Portal O Laranja", href: "#" }} variant="square" />
      </div>

      <RelatedArticles articles={all} current={article} />

      <div className="mt-10 flex justify-center">
        <Button variant="outline" asChild>
          <Link to="/">Voltar para a home</Link>
        </Button>
      </div>
    </div>
  );
}
