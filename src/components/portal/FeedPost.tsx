import { BookOpen, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brand } from "@/lib/brand";
import { formatDate, type Article } from "@/data/demo";
import { CategoryTag } from "./NewsCard";

export function FeedPost({ article }: { article: Article }) {
  const share = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: article.title, url: window.location.href }).catch(() => {});
    } else if (typeof navigator !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
    }
  };
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-colors hover:border-primary/40">
      <header className="flex items-center gap-3 px-4 py-3 md:px-5">
        <img src={brand.emblema} alt="" className="h-9 w-9 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{article.author}</p>
          <time className="text-xs text-muted-foreground">{formatDate(article.publishedAt)}</time>
        </div>
        <CategoryTag>{article.category}</CategoryTag>
      </header>
      <a href="#" className="group block aspect-video overflow-hidden">
        <img src={article.image} alt="" loading="lazy" width={1280} height={720} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
      </a>
      <div className="space-y-2 px-4 pt-4 md:px-5">
        <h3 className="text-xl font-extrabold leading-snug md:text-2xl"><a href="#" className="hover:text-primary">{article.title}</a></h3>
        <p className="text-muted-foreground">{article.excerpt}</p>
      </div>
      <footer className="flex items-center justify-between gap-2 px-4 py-4 md:px-5">
        <Button variant="ghost" size="sm" onClick={share}><Share2 /> Compartilhar</Button>
        <Button size="sm" asChild><a href="#"><BookOpen /> Ler completa</a></Button>
      </footer>
    </article>
  );
}
