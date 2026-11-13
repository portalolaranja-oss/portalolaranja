import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Construction, Pencil, Plus } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { NewsEditor } from "@/components/admin/editor/NewsEditor";
import { NewsManager } from "@/components/admin/NewsManager";
import { Button } from "@/components/ui/button";
import { takePendingArticle } from "@/lib/template-handoff";

export const Route = createFileRoute("/admin/$section")({
  head: () => ({
    meta: [{ title: "Painel O Laranja" }],
  }),
  component: Section,
});

function Section() {
  const { section = "visao" } = Route.useParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<
    | { view: "list" }
    | { view: "editor"; id?: string; title?: string }
  >({ view: "list" });

  const titles: Record<string, { title: string; desc: string }> = {
    garimpo: { title: "Garimpo de notícias", desc: "Pautas e conteúdos em triagem." },
    criar: { title: "Criar notícia", desc: "Editor de nova publicação." },
    publicadas: { title: "Notícias publicadas", desc: "Matérias no ar." },
    rascunhos: { title: "Rascunhos", desc: "Textos aguardando revisão." },
    templates: { title: "Templates sociais", desc: "Modelos para redes sociais." },
    publicidade: { title: "Publicidade", desc: "Banners e anunciantes." },
    rss: { title: "RSS e integrações", desc: "Fontes e feeds externos." },
    redes: { title: "Redes sociais", desc: "Conexão com as plataformas." },
    categorias: { title: "Categorias", desc: "Editorias do portal." },
    usuarios: { title: "Usuários", desc: "Equipe e permissões." },
    configuracoes: { title: "Configurações", desc: "Preferências do painel." },
  };

  const meta = titles[section] ?? { title: "Visão geral", desc: "Resumo do painel." };

  const editorOpen = section === "criar" || mode.view === "editor";
  const editingId = mode.view === "editor" ? mode.id : undefined;
  const editingTitle = mode.view === "editor" ? mode.title : undefined;

  function openEditor(id?: string, title?: string) {
    setMode({ view: "editor", id, title });
  }
  function closeEditor() {
    setMode({ view: "list" });
  }

  // A rota estática /admin/templates cuida do gerador (e do handoff vindo
  // do editor). Aqui só redirecionamos — a lógica vive no arquivo dela.
  if (section === "templates") {
    navigate({ to: "/admin/templates", replace: true });
    return null;
  }

  // Editor completo (criar ou editar) — usa Supabase (ou fallback local).
  if (editorOpen) {
    const pending = mode.view === "editor" ? null : takePendingArticle();
    return (
      <AdminLayout
        current={`/admin/${section}`}
        title={editingId ? `Editar: ${editingTitle ?? "notícia"}` : meta.title}
        description={editingId ? "Ajuste e republique a matéria." : meta.desc}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={closeEditor}>
            ← Voltar à lista
          </Button>
        </div>
        <NewsEditor
          key={editingId ?? "novo"}
          editId={editingId}
          initialArticle={pending}
          onDone={closeEditor}
        />
      </AdminLayout>
    );
  }

  // Gerenciadores de lista por status.
  const managerFilter =
    section === "publicadas" ? "published" : section === "rascunhos" ? "draft" : "all";
  if (section === "publicadas" || section === "rascunhos") {
    return (
      <AdminLayout current={`/admin/${section}`} title={meta.title} description={meta.desc}>
        <NewsManager
          initialFilter={managerFilter}
          onEdit={(id, title) => openEditor(id, title)}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout current={`/admin/${section}`} title={meta.title} description={meta.desc}>
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-20 text-center shadow-card">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Construction className="h-6 w-6" />
        </span>
        <h2 className="text-lg font-bold">Seção em construção</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Esta área do painel ainda será desenvolvida. A estrutura visual e a navegação já estão prontas para receber o conteúdo e a integração futura com o Supabase.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/admin/criar" asChild>
            <Button variant="hero" size="sm">
              <Plus className="mr-1.5 h-4 w-4" /> Criar notícia
            </Button>
          </Link>
          <Link to="/admin/publicadas" asChild>
            <Button variant="outline" size="sm">
              <Pencil className="mr-1.5 h-4 w-4" /> Ver publicadas
            </Button>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
