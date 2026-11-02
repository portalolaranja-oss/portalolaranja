import { brand, categories } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="container-portal grid gap-10 py-12 md:grid-cols-3">
        <div className="flex items-start gap-4">
          <img src={brand.emblema} alt="" className="h-16 w-16 shrink-0 rounded-full" />
          <div>
            <p className="font-display text-lg font-extrabold">{brand.name}</p>
            <p className="text-sm text-muted-foreground">{brand.tagline}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-primary">{brand.city}</p>
          </div>
        </div>
        <div>
          <p className="mb-3 font-display text-sm font-bold uppercase tracking-wide">Editorias</p>
          <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            {categories.map((c) => <li key={c}><a href="#" className="hover:text-primary">{c}</a></li>)}
          </ul>
        </div>
        <div>
          <p className="mb-3 font-display text-sm font-bold uppercase tracking-wide">Institucional</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {["Quem somos", "Fale conosco", "Anuncie", "Política de privacidade"].map((l) => (
              <li key={l}><a href="#" className="hover:text-primary">{l}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {brand.name}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
