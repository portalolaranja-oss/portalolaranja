import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Newspaper, FileEdit, Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminSidebar } from "./AdminSidebar";
import {
  adminSessionAsync,
  adminSignOutAsync,
  type AdminSession,
} from "@/lib/admin-auth";

export function AdminLayout({
  current,
  title,
  description,
  children,
}: {
  current: string;
  title: string;
  description?: string;
  children: React.ReactNode; // eslint-disable-line @typescript-eslint/no-explicit-any
}) {
  const navigate = useNavigate();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [ready, setReady] = useState(false);

  // Guard: protege as rotas do painel. Verifica a sessão real
  // (Supabase `getUser()` ou fallback local) e redireciona se não for autenticado.
  useEffect(() => {
    adminSessionAsync().then((s) => {
      setSession(s);
      setReady(true);
      if (!s) navigate({ to: "/admin/login", replace: true });
    });
  }, [navigate]);

  async function handleLogout() {
    await adminSignOutAsync();
    navigate({ to: "/admin/login" });
  }

  if (!ready || !session) {
    // evita flash de conteúdo; login redireciona
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-sm text-muted-foreground">
        Verificando acesso…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar current={current} session={session} onLogout={handleLogout} />

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
            <Button variant="ghost" size="sm" onClick={handleLogout} title="Sair">
              <LogOut className="mr-1.5 h-4 w-4" /> Sair
            </Button>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-4 md:p-8">{children}</main>

        <footer className="border-t border-border px-4 py-4 text-xs text-muted-foreground md:px-8">
          Painel do Portal O Laranja — {session?.email ?? "admin"} • estrutura preparada para integração futura com Supabase.
        </footer>
      </div>
    </div>
  );
}
