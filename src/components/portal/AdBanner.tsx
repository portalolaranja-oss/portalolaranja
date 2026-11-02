import type { Ad } from "@/data/demo";
import { brand } from "@/lib/brand";

/** Banner publicitário. Recebe dados de um anúncio (futuramente vindo do painel). */
export function AdBanner({ ad, variant = "horizontal" }: { ad: Ad; variant?: "horizontal" | "square" }) {
  const external = ad.href.startsWith("http");
  return (
    <aside aria-label="Publicidade" className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Publicidade</p>
      <a
        href={ad.href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer sponsored" } : {})}
        className={`group relative block overflow-hidden rounded-2xl border border-border bg-ink shadow-card transition-colors hover:border-primary/50 ${variant === "horizontal" ? "aspect-[16/5] min-h-36" : "aspect-square"}`}
      >
        {ad.image ? (
          <img src={ad.image} alt={ad.advertiser} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center gap-5 bg-gradient-to-r from-ink via-surface to-ink p-6">
            <img src={brand.emblema} alt="" className={`shrink-0 rounded-full ${variant === "horizontal" ? "h-20 w-20 md:h-24 md:w-24" : "hidden"}`} />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">{ad.advertiser}</p>
              <p className="mt-1 font-display text-lg font-extrabold leading-tight md:text-2xl">{ad.title}</p>
              <p className="mt-2 text-sm text-muted-foreground group-hover:text-primary">Saiba mais →</p>
            </div>
          </div>
        )}
      </a>
    </aside>
  );
}
