import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Search,
  PenSquare,
  Newspaper,
  FileEdit,
  Megaphone,
  Share2,
  Rss,
  Share,
  FolderTree,
  Users,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { brand } from "@/lib/brand";
import { adminInitials, type AdminSession } from "@/lib/admin-auth";

export const adminMenu = [
  { label: "Visão geral", to: "/admin", icon: LayoutDashboard },
  { label: "Garimpo de notícias", to: "/admin/garimpo", icon: Search },
  { label: "Criar notícia", to: "/admin/criar", icon: PenSquare },
  { label: "Notícias publicadas", to: "/admin/publicadas", icon: Newspaper },
  { label: "Rascunhos", to: "/admin/rascunhos", icon: FileEdit },
  { label: "Templates sociais", to: "/admin/templates", icon: Megaphone },
  { label: "Publicidade", to: "/admin/publicidade", icon: Share2 },
  { label: "RSS e integrações", to: "/admin/rss", icon: Rss },
  { label: "Redes sociais", to: "/admin/redes", icon: Share },
  { label: "Categorias", to: "/admin/categorias", icon: FolderTree },
  { label: "Usuários", to: "/admin/usuarios", icon: Users },
  { label: "Configurações", to: "/admin/configuracoes", icon: Settings },
] as const;

export function AdminSidebar({
  current,
  session,
  onLogout,
}: {
  current: string;
  session: AdminSession | null;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu do painel"
        className="fixed inset-x-4 bottom-4 z-50 flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow lg:hidden"
      >
        <LayoutDashboard className="h-4 w-4" /> Painel
      </button>

      {/* Overlay (mobile) */}
      {open && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-surface transition-transform lg:static lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <Link to="/admin" className="flex min-w-0 items-center gap-2">
            <img src={brand.logo} alt={brand.name} className="h-9 w-auto" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Painel</span>
          </Link>
          <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="lg:hidden">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Menu do painel</p>
          <ul className="space-y-1">
            {adminMenu.map((item) => {
              const active = current === item.to;
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-border px-4 py-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
              {adminInitials(session)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{session?.name ?? "Editor Admin"}</p>
              <p className="truncate text-xs text-muted-foreground">{session?.email ?? "admin@portalolaranja.com.br"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to="/"
              className="flex flex-1 items-center justify-center rounded-md border border-input px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Ver site
            </Link>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Sair"
              className="flex items-center justify-center rounded-md border border-input px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
