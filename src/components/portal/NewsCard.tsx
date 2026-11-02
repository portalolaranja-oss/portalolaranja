import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export function CategoryTag({ children, live }: { children: React.ReactNode; live?: boolean | undefined }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 font-display text-[11px] font-bold uppercase tracking-wider",
      live ? "bg-live text-foreground" : "bg-accent text-accent-foreground",
    )}>
      {live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground" />}
      {children}
    </span>
  );
}

const card = cva("group relative overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all hover:border-primary/50", {
  variants: {
    layout: {
      vertical: "flex flex-col",
      horizontal: "grid grid-cols-[7rem_minmax(0,1fr)] sm:grid-cols-[10rem_minmax(0,1fr)]",
      featured: "min-h-[22rem] md:min-h-[28rem]",
    },
  },
  defaultVariants: { layout: "vertical" },
});

export interface NewsCardProps extends VariantProps<typeof card> {
  title: string;
  category: string;
  time: string;
  excerpt?: string | undefined;
  image?: string | undefined;
  live?: boolean | undefined;
}

function Placeholder() {
  return <div className="h-full w-full bg-gradient-to-br from-muted to-surface" />;
}

export function NewsCard({ layout, title, category, time, excerpt, image, live }: NewsCardProps) {
  const img = image ? <img src={image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <Placeholder />;

  if (layout === "featured") {
    return (
      <article className={card({ layout })}>
        <div className="absolute inset-0">{img}</div>
        <div className="absolute inset-0 bg-gradient-fade" />
        <div className="relative flex h-full min-h-[inherit] flex-col justify-end gap-3 p-6 md:p-8">
          <CategoryTag live={live}>{category}</CategoryTag>
          <h2 className="text-2xl font-extrabold leading-tight md:text-4xl">{title}</h2>
          {excerpt && <p className="max-w-2xl text-muted-foreground">{excerpt}</p>}
          <time className="text-xs text-muted-foreground">{time}</time>
        </div>
      </article>
    );
  }

  return (
    <article className={card({ layout })}>
      <div className={layout === "horizontal" ? "h-full min-h-24" : "aspect-video"}>{img}</div>
      <div className="flex min-w-0 flex-col gap-2 p-4">
        <CategoryTag live={live}>{category}</CategoryTag>
        <h3 className="line-clamp-3 font-display text-base font-bold leading-snug transition-colors group-hover:text-primary">{title}</h3>
        {excerpt && layout !== "horizontal" && <p className="line-clamp-2 text-sm text-muted-foreground">{excerpt}</p>}
        <time className="mt-auto text-xs text-muted-foreground">{time}</time>
      </div>
    </article>
  );
}
