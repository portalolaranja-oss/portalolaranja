import { createFileRoute } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/$section")({
  head: () => ({
    meta: [{ title: "Painel O Laranja" }],
  }),
  component: Section,
});

function Section() {
  const { section = "visao" } = Route.useParams();
  const name = section;
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

  const meta = titles[name] ?? { title: "Visão geral", desc: "Resumo do painel." };

  return (
    <AdminLayout current={`/admin/${name}`} title={meta.title} description={meta.desc}>
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-20 text-center shadow-card">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Construction className="h-6 w-6" />
        </span>
        <h2 className="text-lg font-bold">Seção em construção</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Esta área do painel ainda será desenvolvida. A estrutura visual e a navegação já estão prontas para receber o conteúdo e a integração futura com o Supabase.
        </p>
      </div>
    </AdminLayout>
  );
}
