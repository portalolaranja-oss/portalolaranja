// Painel do Gerador de Templates Sociais (Portal O Laranja).
// Integra com o editor de notícias: ao selecionar uma pauta (ou a notícia
// aberta), o usuário ajusta título/subtítulo/categoria/imagem e baixa as
// artes em PNG (individual ou todas). Com Supabase conectado, as artes
// também são gravadas no bucket `news-images` (sem duplicar a tabela
// `news` — apenas arquivos de saída do gerador).

import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Loader2,
  Download,
  Images,
  Eye,
  EyeOff,
  Save,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { demoArticles, type Article } from "@/data/demo";
import { CATEGORY_OPTIONS, getNewsList, slugify, type NewsListItem } from "@/lib/news";
import {
  SOCIAL_FORMATS,
  TEMPLATE_STYLES,
  type SocialFormatKey,
  type TemplateStyleKey,
} from "@/lib/template-presets";
import {
  generateAll,
  downloadArt,
  downloadAllArts,
  type GeneratedArt,
  type ArtOptions,
} from "@/lib/template-generator";
import { setPendingArticle } from "@/lib/template-handoff";

export interface TemplatesProps {
  /** Notícia já carregada no editor (título, resumo, imagem, categoria). */
  initialArticle?: Article;
  /** Editável: usuário pode ajustar campos antes de gerar as artes. */
  editable?: boolean;
}

export function SocialTemplatesPanel({
  initialArticle,
  editable = true,
}: TemplatesProps) {
  const navigate = useNavigate();
  const [newsList, setNewsList] = useState<NewsListItem[] | null>(null);
  const [selectedId, setSelectedId] = useState<string>(initialArticle?.id ?? "");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(initialArticle ?? null);

  // Campos editáveis (inicial: o que veio da notícia)
  const [title, setTitle] = useState(initialArticle?.title ?? "");
  const [subtitle, setSubtitle] = useState(initialArticle?.subtitle ?? initialArticle?.excerpt ?? "");
  const [category, setCategory] = useState<string>(initialArticle?.category ?? CATEGORY_OPTIONS[0]);
  const [image, setImage] = useState(initialArticle?.image ?? "");
  const [align, setAlign] = useState<"top" | "middle" | "bottom">("bottom");
  const [format, setFormat] = useState<SocialFormatKey>("ig-feed");
  const [style, setStyle] = useState<TemplateStyleKey>("editorial");

  const [arts, setArts] = useState<GeneratedArt[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedUrl, setSavedUrl] = useState<string>("");
  const [showPreview, setShowPreview] = useState(true);

  // Sincroniza campos quando a notícia aberta muda.
  useEffect(() => {
    if (!initialArticle) return;
    setTitle(initialArticle.title || "");
    setSubtitle(initialArticle.subtitle || initialArticle.excerpt || "");
    setCategory(initialArticle.category || CATEGORY_OPTIONS[0]);
    setImage(initialArticle.image || "");
    setSelectedArticle(initialArticle);
    setSelectedId(initialArticle.id);
  }, [initialArticle]);

  // Lista de notícias para trocar de pauta (modo standalone).
  useEffect(() => {
    if (initialArticle) return;
    let alive = true;
    getNewsList().then((list) => {
      if (!alive) return;
      setNewsList(list);
    });
    return () => {
      alive = false;
    };
  }, [initialArticle]);

  function loadArticle(item: NewsListItem) {
    const local = demoArticles.find((a) => a.id === item.id || a.slug === item.slug);
    const a: Article = local
      ? { ...local, category: item.category || local.category }
      : ({
          id: item.id,
          slug: item.slug,
          category: item.category || "Nova Iguaçu",
          title: item.title,
          excerpt: "",
          body: [],
          image: "",
          publishedAt: item.updatedAt || new Date().toISOString(),
          author: item.author || "Redação O Laranja",
        } as Article);
    setSelectedArticle(a);
    setSelectedId(item.id);
    setTitle(item.title || "");
    setSubtitle(local?.excerpt || "");
    setCategory(item.category || CATEGORY_OPTIONS[0]);
    setImage(local?.image || "");
    setArts(null);
    setSavedUrl("");
  }

  async function regenerate() {
    if (!selectedArticle) {
      toast.error("Selecione uma notícia para gerar artes.");
      return;
    }
    setGenerating(true);
    try {
      const base: Omit<ArtOptions, "format" | "style"> = {
        article: {
          ...selectedArticle,
          title,
          subtitle,
          category,
          image: image || selectedArticle.image,
        },
        subtitle,
        align,
      };
      const out = await generateAll(base);
      setArts(out);
      setSavedUrl("");
      toast.success("Artes geradas com os dados da notícia.", {
        description: `${out.length} imagens (${SOCIAL_FORMATS.length} formatos × ${TEMPLATE_STYLES.length} modelos) prontas para download ou envio.`,
      });
    } catch (e) {
      console.error(e);
      toast.error("Falha ao gerar artes.", {
        description: e instanceof Error ? e.message : "Tente novamente.",
      });
    } finally {
      setGenerating(false);
    }
  }

  async function saveAll() {
    if (!arts || !supabase) {
      toast.error("Supabase não conectado — somente download local.", {
        description: "Conecte a integração para salvar as artes no Storage.",
      });
      return;
    }
    setSaving(true);
    const base = slugify(title || selectedArticle?.title || "arte");
    const paths: string[] = [];
    try {
      for (const art of arts) {
        const blob = dataUrlToBlob(art.dataUrl);
        const path = `social-templates/${Date.now()}/${art.formatKey}-${art.styleKey}-${base}.png`;
        const { error } = await supabase.storage
          .from("news-images")
          .upload(path, blob, { upsert: true });
        if (error) throw new Error(error.message);
        const { data } = supabase.storage.from("news-images").getPublicUrl(path);
        paths.push(data.publicUrl);
      }
      setSavedUrl(paths[0] ?? "");
      toast.success(`${paths.length} artes salvas no Storage.`, {
        description: "As URLs públicas estão disponíveis para uso em campanhas.",
      });
    } catch (e) {
      console.error(e);
      toast.error("Falha ao salvar no Storage.", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  function openInEditor() {
    if (!selectedArticle) return;
    setPendingArticle(selectedArticle);
    navigate({ to: "/admin/criar" });
  }

  // Filtra as artes pela combinação de formato + modelo escolhida.
  const visibleArts = (arts ?? []).filter(
    (a) => a.formatKey === format && a.styleKey === style,
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      {/* Coluna esquerda: controles */}
      <div className="space-y-4">
        {/* Seleção de notícia (só no modo standalone) */}
        {!initialArticle && (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                1 · Notícia
              </h3>
              {newsList && newsList.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => loadArticle(newsList[0])}>
                  Recarregar
                </Button>
              )}
            </div>
            <Select
              value={selectedId}
              onValueChange={(v) => {
                const item = newsList?.find((n) => n.id === v);
                if (item) loadArticle(item);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={newsList ? "Escolher notícia…" : "Carregando notícias…"} />
              </SelectTrigger>
              <SelectContent>
                {(newsList ?? []).map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.title || n.slug}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>
        )}

        {/* Notícia fixa (modo integrado ao editor) */}
        {initialArticle && (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Notícia em edição
            </h3>
            <div className="rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm">
              <p className="font-semibold">{initialArticle.title}</p>
              <p className="text-xs text-muted-foreground">
                {initialArticle.category} • {initialArticle.slug}
              </p>
            </div>
          </section>
        )}

        {/* Edição de campos */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            2 · Conteúdo
          </h3>
          {!editable ? (
            <p className="text-sm text-muted-foreground">
              Conteúdo fixo: os campos são preenchidos pela notícia selecionada. Para editar, abra a
              notícia no editor principal.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="tpl-title">Título</Label>
                <Input
                  id="tpl-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Manchete da arte"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tpl-sub">Subtítulo / resumo</Label>
                <Input
                  id="tpl-sub"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Uma linha de apoio"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Categoria</Label>
                  <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Posição do texto</Label>
                  <Select value={align} onValueChange={(v) => v && setAlign(v as "top" | "middle" | "bottom")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Topo</SelectItem>
                      <SelectItem value="middle">Meio</SelectItem>
                      <SelectItem value="bottom">Base</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tpl-img">Imagem (URL opcional)</Label>
                <Input
                  id="tpl-img"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="Deixe vazio para usar a capa da notícia"
                />
                {image && (
                  <div className="mt-2 flex items-center gap-3">
                    <img src={image} alt="Prévia" className="h-14 w-20 rounded-md object-cover" />
                    <button
                      type="button"
                      onClick={() => setImage("")}
                      className="text-xs text-muted-foreground underline hover:text-foreground"
                    >
                      Usar imagem original da notícia
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Modelo e formato */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            3 · Modelo e formato
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATE_STYLES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStyle(s.key)}
                  className={
                    "rounded-lg border p-3 text-left transition-colors " +
                    (style === s.key
                      ? "border-primary bg-primary/15"
                      : "border-border bg-surface hover:border-primary/40")
                  }
                >
                  <p className="text-sm font-bold">{s.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.tagline}</p>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {SOCIAL_FORMATS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFormat(f.key)}
                  className={
                    "rounded-lg border p-3 text-left transition-colors " +
                    (format === f.key
                      ? "border-primary bg-primary/15"
                      : "border-border bg-surface hover:border-primary/40")
                  }
                >
                  <p className="text-sm font-bold">{f.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.width}×{f.height} · {f.ratio}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Ações */}
        <section className="flex flex-wrap gap-2">
          <Button variant="hero" size="sm" onClick={regenerate} disabled={generating || !title.trim()}>
            {generating ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Images className="mr-1.5 h-4 w-4" />
            )}
            Gerar artes ({SOCIAL_FORMATS.length * TEMPLATE_STYLES.length})
          </Button>
          {arts && arts.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadAllArts(arts, slugify(title || "arte"))}
              >
                <Download className="mr-1.5 h-4 w-4" /> Baixar todas
              </Button>
              <Button variant="outline" size="sm" onClick={saveAll} disabled={saving || !supabase}>
                {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                {supabase ? "Salvar no Storage" : "Salvar (requer Supabase)"}
              </Button>
              <Button variant="ghost" size="sm" onClick={openInEditor}>
                <Pencil className="mr-1.5 h-4 w-4" /> Abrir no editor
              </Button>
            </>
          )}
        </section>
      </div>

      {/* Coluna direita: prévias e download */}
      <div className="space-y-4">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Pré-visualização
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setShowPreview((v) => !v)}>
              {showPreview ? <EyeOff className="mr-1.5 h-4 w-4" /> : <Eye className="mr-1.5 h-4 w-4" />}
              {showPreview ? "Ocultar" : "Mostrar"}
            </Button>
          </div>

          {generating ? (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Gerando artes com os dados da notícia…
            </div>
          ) : !arts ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Clique em <strong className="text-foreground">Gerar artes</strong> para criar as{" "}
              {SOCIAL_FORMATS.length * TEMPLATE_STYLES.length} combinações de formato × modelo com a
              identidade do Portal.
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Exibindo {visibleArts.length} de {arts.length} artes — formato{" "}
                {SOCIAL_FORMATS.find((f) => f.key === format)?.label} · modelo{" "}
                {TEMPLATE_STYLES.find((s) => s.key === style)?.name}.
              </p>
              {showPreview ? (
                visibleArts.map((art) => (
                  <figure key={art.id} className="overflow-hidden rounded-xl border border-border">
                    <div className="relative bg-black/60 p-3">
                      <img
                        src={art.dataUrl}
                        alt={`${art.formatLabel} · ${art.styleLabel}`}
                        style={{ maxWidth: "100%", height: "auto" }}
                        className="mx-auto"
                      />
                      <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        {art.formatLabel} · {art.width}×{art.height}
                      </span>
                    </div>
                    <figcaption className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
                      <span>
                        {art.styleLabel} · {art.formatLabel}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => downloadArt(art, slugify(title || "arte"))}>
                        <Download className="h-3.5 w-3.5" /> PNG
                      </Button>
                    </figcaption>
                  </figure>
                ))
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {visibleArts.map((art) => (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() => downloadArt(art, slugify(title || "arte"))}
                      className="group overflow-hidden rounded-lg border border-border hover:border-primary"
                    >
                      <img src={art.dataUrl} alt={art.formatLabel} className="aspect-square w-full object-cover" />
                      <span className="block bg-surface px-2 py-1 text-left text-[10px] text-muted-foreground group-hover:text-foreground">
                        {art.formatLabel}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {savedUrl && (
          <section className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-xs">
            <p className="font-semibold text-foreground">Artes salvas no Storage (news-images)</p>
            <p className="mt-1 break-all text-muted-foreground">{savedUrl}</p>
            <p className="mt-1 text-muted-foreground">
              As demais URLs seguem o mesmo prefixo com a extensão da imagem.
            </p>
          </section>
        )}

        <section className="rounded-2xl border border-dashed border-border p-4 text-xs text-muted-foreground">
          <p>
            As artes usam apenas os campos editáveis (título, subtítulo, categoria, imagem). O texto
            completo não é copiado — isso preserva direitos de terceiros e mantém o foco no resumo
            da notícia.
          </p>
        </section>
      </div>
    </div>
  );
}

function dataUrlToBlob(dataUrl: string): Blob {
  const base64 = dataUrl.split(",")[1];
  const byteString = atob(base64);
  const ab = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) ab[i] = byteString.charCodeAt(i);
  return new Blob([ab], { type: "image/png" });
}
