import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Pencil,
  Trash2,
  Loader2,
  Inbox,
  Eye,
  Rocket,
  CalendarClock,
  FileEdit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getNewsList,
  setNewsStatus,
  deleteNews,
  statusLabel,
  STATUS_STYLES,
  type NewsListItem,
  type NewsStatus,
} from "@/lib/news";
import { formatDate } from "@/data/demo";

const FILTERS: { value: NewsStatus | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "draft", label: "Rascunhos" },
  { value: "review", label: "Em revisão" },
  { value: "scheduled", label: "Agendadas" },
  { value: "published", label: "Publicadas" },
];

export function NewsManager({
  initialFilter = "all",
  onEdit,
}: {
  initialFilter?: NewsStatus | "all";
  onEdit: (id: string, title: string) => void;
}) {
  const [items, setItems] = useState<NewsListItem[] | null>(null);
  const [filter, setFilter] = useState<NewsStatus | "all">(initialFilter);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getNewsList().then((r) => {
      if (active) setItems(r);
    });
    return () => {
      active = false;
    };
  }, []);

  async function act(id: string, action: "publish" | "review" | "schedule") {
    setBusy(id + action);
    if (action === "publish") {
      const ok = await setNewsStatus(id, "published");
      toast[ok ? "success" : "error"](
        ok ? "Notícia publicada." : "Falha ao publicar.",
        ok ? { description: "Ela já está na home e na categoria." } : undefined,
      );
    } else if (action === "review") {
      await setNewsStatus(id, "review");
      toast.success("Enviada para revisão.");
    } else {
      const at = new Date().toISOString();
      await setNewsStatus(id, "scheduled", at);
      toast.success("Agendada.", { description: "Defina a data exata no editor." });
    }
    setBusy(null);
    setItems(await getNewsList());
  }

  async function remove(id: string) {
    const ok = await deleteNews(id);
    toast[ok ? "success" : "error"](ok ? "Notícia excluída." : "Falha ao excluir.");
    setItems(await getNewsList());
  }

  if (!items) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando notícias…
      </div>
    );
  }

  const visible = filter === "all" ? items : items.filter((i) => i.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={
              "rounded-full px-3 py-1 text-xs font-semibold transition-colors " +
              (filter === f.value
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:text-foreground")
            }
          >
            {f.label}
            <span className="ml-1 opacity-70">
              {f.value === "all" ? items.length : items.filter((i) => i.status === f.value).length}
            </span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhuma notícia aqui ainda. Use o botão <strong className="text-foreground">Criar notícia</strong> para começar.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map((it) => (
            <li
              key={it.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40"
            >
              <span
                className={
                  "inline-flex w-24 shrink-0 items-center justify-center rounded-md px-2 py-1 text-center text-[11px] font-bold uppercase tracking-wide " +
                  STATUS_STYLES[(it.status as NewsStatus) ?? "draft"].className
                }
              >
                {statusLabel(it.status)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{it.title || "(sem título)"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {it.category} • {it.author} • {it.updatedAt ? formatDate(it.updatedAt) : "—"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <IconBtn label="Ver no site" onClick={() => window.open(`/noticia/${it.slug}`, "_blank")}>
                  <Eye className="h-4 w-4" />
                </IconBtn>
                <IconBtn label="Editar" onClick={() => onEdit(it.id, it.title)}>
                  <Pencil className="h-4 w-4" />
                </IconBtn>
                {it.status !== "published" && (
                  <IconBtn
                    label="Publicar"
                    disabled={busy === it.id + "publish"}
                    onClick={() => act(it.id, "publish")}
                  >
                    {busy === it.id + "publish" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                  </IconBtn>
                )}
                {it.status === "draft" && (
                  <IconBtn
                    label="Enviar revisão"
                    disabled={busy === it.id + "review"}
                    onClick={() => act(it.id, "review")}
                  >
                    {busy === it.id + "review" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileEdit className="h-4 w-4" />}
                  </IconBtn>
                )}
                {it.status === "review" && (
                  <IconBtn
                    label="Agendar"
                    disabled={busy === it.id + "schedule"}
                    onClick={() => act(it.id, "schedule")}
                  >
                    {busy === it.id + "schedule" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
                  </IconBtn>
                )}
                <IconBtn label="Excluir" onClick={() => remove(it.id)} className="hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </IconBtn>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        {visible.length} de {items.length} notícias • Filtro: <Link to="/admin" className="text-primary hover:underline">todas</Link>
      </p>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  children,
  disabled,
  className = "",
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={
        "inline-flex h-8 w-8 items-center justify-center rounded-md border border-input text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50 " +
        className
      }
    >
      {children}
    </button>
  );
}
