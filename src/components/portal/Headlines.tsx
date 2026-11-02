import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, type Article } from "@/data/demo";
import { CategoryTag } from "./NewsCard";

export function MainHeadline({ article }: { article: Article }) {
  return (
    <article className="group relative min-h-[24rem] overflow-hidden rounded-2xl border border-border shadow-card md:min-h-[32rem]">
      <img src={article.image} alt="" width={1280} height={720} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-fade" />
      <div className="relative flex h-full min-h-[inherit] flex-col justify-end gap-3 p-6 md:p-10">
        <CategoryTag solid>{article.category}</CategoryTag>
        <h1 className="max-w-3xl text-3xl font-extrabold leading-tight md:text-5xl">{article.title}</h1>
        <p className="max-w-2xl text-base text-muted-foreground md:text-lg">{article.excerpt}</p>
        <div className="flex flex-wrap items-center gap-4">
          <time className="flex items-center gap-1.5 text-sm text-muted-foreground"><Clock className="h-4 w-4" />{formatDate(article.publishedAt)}</time>
          <Button asChild size="sm"><a href="#">Ler notícia <ArrowRight /></a></Button>
        </div>
      </div>
    </article>
  );
}

export function SecondaryHeadline({ article }: { article: Article }) {
  return (
    <a href="#" className="group relative block min-h-[12rem] flex-1 overflow-hidden rounded-2xl border border-border shadow-card transition-colors hover:border-primary/50">
      <img src={article.image} alt="" loading="lazy" width={1280} height={720} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-fade" />
      <div className="relative flex h-full min-h-[inherit] flex-col justify-end gap-2 p-5">
        <CategoryTag solid>{article.category}</CategoryTag>
        <h2 className="text-lg font-extrabold leading-snug transition-colors group-hover:text-primary">{article.title}</h2>
        <time className="text-xs text-muted-foreground">{formatDate(article.publishedAt)}</time>
      </div>
    </a>
  );
}
