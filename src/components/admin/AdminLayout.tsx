import { Link } from "@tanstack/react-router";
import { Newspaper, FileEdit, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayout({
  current,
  title,
  description,
  children,
}: {
  current: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar current={current} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-md md:px-8">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold md:text-xl">{title}</h1>
            {description && <p className="truncate text-xs text-muted-foreground md:text-sm">{description}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin/criar" asChild>
              <Button variant="hero" size="sm">
                <Plus className="mr-1.5 h-4 w-4" /> Criar notícia
              </Button>
            </Link>
            <Link to="/admin/publicadas" asChild>
              <Button variant="outline" size="sm">
                <Newspaper className="mr-1.5 h-4 w-4" /> Publicadas
              </Button>
            </Link>
            <Link to="/admin/rascunhos" asChild>
              <Button variant="ghost" size="sm">
                <FileEdit className="mr-1.5 h-4 w-4" /> Rascunhos
              </Button>
            </Link>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-4 md:p-8">{children}</main>

        <footer className="border-t border-border px-4 py-4 text-xs text-muted-foreground md:px-8">
          Painel do Portal O Laranja — estrutura preparada para integração futura com Supabase.
        </footer>
      </div>
    </div>
  );
}
