import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Save,
  Rocket,
  CalendarClock,
  Eye,
  Tag,
  X,
  Loader2,
  FileEdit,
  EyeOff,
  Images,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "./RichTextEditor";
import { ImageUpload } from "./ImageUpload";
import {
  CATEGORY_OPTIONS,
  NEWS_STATUSES,
  createOrUpdateNews,
  getNewsById,
  slugify,
  statusLabel,
  type ArticleFormData,
  type NewsStatus,
} from "@/lib/news";
import { formatDate, type Article } from "@/data/demo";
import { setPendingArticle } from "@/lib/template-handoff";

function emptyForm(): ArticleFormData {
  return {
    title: "",
    subtitle: "",
    body: "",
    coverImage: "",
    gallery: [],
    category: CATEGORY_OPTIONS[0],
    tags: [],
    author: "",
    source: "",
    credits: "",
    status: "draft",
    scheduledAt: "",
    seo: { title: "", description: "", slug: "" },
  };
}

export function NewsEditor({
  editId,
  onDone,
  initialArticle,
}: {
  editId?: string;
  onDone: (msg?: string) => void;
  /** Notícia pré-carregada (ex.: vinda do Gerador de Templates). */
  initialArticle?: Article | null;
}) {
  const navigate = useNavigate();
  const [form, setForm] = useState<ArticleFormData>(emptyForm);
  const [loading, setLoading] = useState(Boolean(editId));
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState<null | "draft" | NewsStatus>(null);
  const [preview, setPreview] = useState(false);
  const [tagInput, setTagInput] = useState("");

  function set<K extends keyof ArticleFormData>(key: K, value: ArticleFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setSeo<K extends keyof ArticleFormData["seo"]>(key: K, value: ArticleFormData["seo"][K]) {
    setForm((f) => ({ ...f, seo: { ...f.seo, [key]: value } }));
  }

  // Carrega a notícia existente para edição (quando editId informado).
  // Disparado uma única vez ao montar, via estado `loaded`.
  function loadForEdit(id: string) {
    setLoading(true);
    getNewsById(id)
      .then((data) => {
        if (data) setForm(data);
      })
      .finally(() => {
        setLoading(false);
        setLoaded(true);
      });
  }

  // Notícia pré-carregada pelo Gerador de Templates (sem id = rascunho novo).
  useEffect(() => {
    if (!initialArticle || editId) return;
    setForm({
      title: initialArticle.title,
      subtitle: initialArticle.subtitle ?? initialArticle.excerpt ?? "",
      body: "",
      coverImage: initialArticle.image ?? "",
      gallery: [],
      category: initialArticle.category || CATEGORY_OPTIONS[0],
      tags: [],
      author: initialArticle.author || "",
      source: initialArticle.source ?? "",
      credits: initialArticle.credits ?? "",
      status: "draft",
      scheduledAt: "",
      seo: {
        title: initialArticle.title,
        description: initialArticle.excerpt ?? "",
        slug: initialArticle.slug,
      },
    });
    setLoaded(true);
  }, [initialArticle, editId]);

  if (editId && loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando notícia…
      </div>
    );
  }

  if (editId && !loading && !loaded) loadForEdit(editId);

  function addTag() {
    const t = tagInput.trim().replace(/,$/, "");
    if (t && !form.tags.includes(t)) set("tags", [...form.tags, t]);
    setTagInput("");
  }

  function removeTag(i: number) {
    set("tags", form.tags.filter((_, idx) => idx !== i));
  }

  function insertImageFromUpload(url: string) {
    // insere a imagem recém-enviada no corpo do editor
    set("body", form.body + `<p><img src="${url}" alt="imagem"/></p>`);
    if (!form.coverImage) set("coverImage", url);
  }

  function goGenerateArts() {
    // Monta a notícia atual (com os campos em edição) e a entrega ao gerador.
    const a: Article = {
      id: editId ?? "novo",
      slug: form.seo.slug || slugify(form.title) || "novo",
      category: form.category || CATEGORY_OPTIONS[0],
      title: form.title || "Título da notícia",
      subtitle: form.subtitle,
      excerpt: form.subtitle,
      body: [],
      image: form.coverImage,
      publishedAt: form.scheduledAt || new Date().toISOString(),
      author: form.author || "Redação O Laranja",
    };
    setPendingArticle(a);
    navigate({ to: "/admin/templates" });
  }

  async function persist(status: NewsStatus) {
    const payload: ArticleFormData = {
      ...form,
      status,
      scheduledAt: status === "scheduled" ? form.scheduledAt || new Date().toISOString() : form.scheduledAt,
      seo: {
        ...form.seo,
        slug: form.seo.slug || slugify(form.title),
        title: form.seo.title || form.title,
      },
    };
    if (!payload.title.trim()) {
      toast.error("Título é obrigatório.");
      return;
    }
    setSaving(status);
    const res = await createOrUpdateNews(payload, editId);
    setSaving(null);
    if (!res.ok) {
      toast.error("Não foi possível salvar.", { description: res.error });
      return;
    }
    const label = statusLabel(status);
    if (status === "draft") toast.success("Rascunho salvo.", { description: "Você pode continuar depois em Rascunhos." });
    else toast.success(`Notícia ${label.toLowerCase()}.`, { description: `Disponível em ${payload.seo.slug ? "/" + payload.seo.slug : "home e categoria"}.` });
    onDone(label);
  }

  const scheduledLocal = form.scheduledAt
    ? new Date(form.scheduledAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
    : "";

  return (
    <div className="space-y-6">
      {/* Barra de ações */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-2 text-sm font-semibold transition-colors hover:bg-accent"
          >
            {preview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {preview ? "Editar" : "Pré-visualizar"}
          </button>
          <button
            type="button"
            onClick={goGenerateArts}
            className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-2 text-sm font-semibold transition-colors hover:bg-accent"
            title="Abrir o Gerador de Templates Sociais com os dados desta notícia"
          >
            <Images className="h-4 w-4" /> Gerar artes
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => persist("draft")} disabled={saving !== null}>
            {saving === "draft" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
            Salvar rascunho
          </Button>
          <Button variant="outline" size="sm" onClick={() => persist("review")} disabled={saving !== null}>
            {saving === "review" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileEdit className="mr-1.5 h-4 w-4" />}
            Enviar revisão
          </Button>
          <Button variant="outline" size="sm" onClick={() => persist("scheduled")} disabled={saving !== null}>
            {saving === "scheduled" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CalendarClock className="mr-1.5 h-4 w-4" />}
            Agendar
          </Button>
          <Button variant="hero" size="sm" onClick={() => persist("published")} disabled={saving !== null}>
            {saving === "published" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Rocket className="mr-1.5 h-4 w-4" />}
            Publicar
          </Button>
        </div>
      </div>

      {preview ? (
        <Preview form={form} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* Coluna principal */}
          <div className="space-y-5 rounded-xl border border-border bg-card p-5">
            <div className="space-y-1.5">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Manchete da notícia" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subtitle">Subtítulo</Label>
              <Input id="subtitle" value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="Resumo curto abaixo do título" />
            </div>

            <div className="space-y-1.5">
              <Label>Texto completo</Label>
              <RichTextEditor
                value={form.body}
                onChange={(html) => set("body", html)}
                onInsertImage={(url) => insertImageFromUpload(url)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Imagens</Label>
              <ImageUpload
                cover={form.coverImage}
                onCover={(url) => set("coverImage", url)}
                gallery={form.gallery}
                onGallery={(urls) => set("gallery", urls)}
              />
            </div>

            {/* Autor / Fonte / Créditos */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="author">Autor</Label>
                <Input id="author" value={form.author} onChange={(e) => set("author", e.target.value)} placeholder="Redação O Laranja" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="source">Fonte original</Label>
                <Input id="source" value={form.source} onChange={(e) => set("source", e.target.value)} placeholder="Agência / veículo" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="credits">Créditos</Label>
                <Input id="credits" value={form.credits} onChange={(e) => set("credits", e.target.value)} placeholder="Fotógrafo, ilustrações…" />
              </div>
            </div>

            {/* SEO */}
            <details className="group rounded-lg border border-border bg-surface">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold">
                <span className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" /> SEO — meta tags e URL amigável
                </span>
                <span className="text-xs text-muted-foreground group-open:hidden">expandir</span>
              </summary>
              <div className="space-y-3 border-t border-border p-4">
                <div className="space-y-1.5">
                  <Label htmlFor="seo-title">Título SEO</Label>
                  <Input id="seo-title" value={form.seo.title} onChange={(e) => setSeo("title", e.target.value)} placeholder="Título para mecanismos de busca" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="seo-desc">Descrição SEO</Label>
                  <Textarea id="seo-desc" value={form.seo.description} onChange={(e) => setSeo("description", e.target.value)} placeholder="Meta description" rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="seo-slug">URL amigável (slug)</Label>
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-xs text-muted-foreground">/noticia/</span>
                    <Input id="seo-slug" value={form.seo.slug} onChange={(e) => setSeo("slug", e.target.value)} placeholder={slugify(form.title) || "url-da-noticia"} />
                  </div>
                </div>
              </div>
            </details>
          </div>

          {/* Coluna lateral */}
          <div className="space-y-5">
            {/* Publicação */}
            <div className="space-y-4 rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-bold uppercase tracking-wide">Publicação</h3>
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(v) => v && set("status", v as NewsStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NEWS_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.status === "scheduled" && (
                <div className="space-y-1.5">
                  <Label htmlFor="scheduled">Data e hora</Label>
                  <Input
                    id="scheduled"
                    type="datetime-local"
                    value={form.scheduledAt ? form.scheduledAt.slice(0, 16) : ""}
                    onChange={(e) => set("scheduledAt", e.target.value ? new Date(e.target.value).toISOString() : "")}
                  />
                  {scheduledLocal && <p className="text-xs text-muted-foreground">Agendada para {scheduledLocal}.</p>}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Ao <strong className="text-foreground">Publicar</strong>, a notícia entra na home, na página da categoria e na página individual automaticamente.
              </p>
            </div>

            {/* Categoria e tags */}
            <div className="space-y-4 rounded-xl border border-border bg-card p-5">
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => v && set("category", v)}>
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
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-1.5">
                  {form.tags.map((t, i) => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium">
                      {t}
                      <button type="button" onClick={() => removeTag(i)} aria-label={`Remover ${t}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  onBlur={addTag}
                  placeholder="Digite e pressione Enter"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Preview({ form }: { form: ArticleFormData }) {
  return (
    <div className="mx-auto max-w-3xl space-y-4 rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-primary">
        {form.category && <span>{form.category}</span>}
        <span className="text-muted-foreground">Pré-visualização</span>
      </div>
      <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">{form.title || "Título da notícia"}</h1>
      {form.subtitle && <p className="text-lg text-muted-foreground">{form.subtitle}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-semibold">
          Por {form.author || "Redação O Laranja"}
          {form.source && <span className="text-muted-foreground"> · Fonte: {form.source}</span>}
        </span>
        {form.scheduledAt && <span className="text-muted-foreground">Agendada: {formatDate(form.scheduledAt)}</span>}
      </div>
      {form.coverImage && (
        <figure className="overflow-hidden rounded-xl border border-border">
          <img src={form.coverImage} alt="" className="aspect-video w-full object-cover" />
          {form.credits && <figcaption className="px-3 py-2 text-xs text-muted-foreground">{form.credits}</figcaption>}
        </figure>
      )}
      {form.body && (
        <div
          className="prose-preview space-y-3 text-base leading-7 [&_p]:my-2 [&_h2]:text-2xl [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:text-primary [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: form.body }}
        />
      )}
      {form.gallery.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {form.gallery.map((u, i) => (
            <img key={i} src={u} alt="" className="aspect-video w-full rounded-lg object-cover" />
          ))}
        </div>
      )}
      {form.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2">
          {form.tags.map((t) => (
            <span key={t} className="rounded-full bg-accent px-2.5 py-1 text-xs">{t}</span>
          ))}
        </div>
      )}
      {form.seo.description && (
        <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          <strong className="text-foreground">Meta description:</strong> {form.seo.description}
        </div>
      )}
    </div>
  );
}
