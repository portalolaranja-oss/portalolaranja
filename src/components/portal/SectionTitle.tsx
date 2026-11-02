export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-border pb-3">
      <h2 className="flex items-center gap-3 text-xl font-extrabold uppercase md:text-2xl">
        <span className="h-6 w-1.5 rounded-full bg-gradient-brand" />
        {children}
      </h2>
      {action}
    </div>
  );
}

export function BreakingTicker({ items }: { items: string[] }) {
  const list = [...items, ...items];
  return (
    <div className="border-b border-border bg-surface">
      <div className="container-portal flex h-10 items-center gap-4 overflow-hidden">
        <span className="shrink-0 rounded-sm bg-primary px-2 py-0.5 font-display text-xs font-extrabold uppercase text-primary-foreground">Urgente</span>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex w-max animate-ticker gap-10 text-sm text-muted-foreground">
            {list.map((t, i) => <span key={i} className="whitespace-nowrap">{t}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}
