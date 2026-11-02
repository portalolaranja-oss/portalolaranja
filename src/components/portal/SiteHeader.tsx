import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brand, categories } from "@/lib/brand";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="container-portal grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 md:h-20 lg:flex lg:justify-between">
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu" onClick={() => setOpen((v) => !v)}>
          {open ? <X /> : <Menu />}
        </Button>
        <Link to="/" className="flex min-w-0 items-center justify-center lg:justify-start">
          <img src={brand.logo} alt={brand.name} className="h-12 w-auto md:h-16" />
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Buscar"><Search /></Button>
          <Button size="sm" className="hidden sm:inline-flex">Envie sua notícia</Button>
        </div>
      </div>
      <nav className={`${open ? "block" : "hidden"} border-t border-border lg:block`}>
        <ul className="container-portal flex flex-col gap-1 py-2 lg:flex-row lg:gap-6 lg:overflow-x-auto">
          {categories.map((c, i) => (
            <li key={c}>
              <a href="#" className={`block py-2 font-display text-sm font-semibold uppercase tracking-wide transition-colors hover:text-primary ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>
                {c}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
