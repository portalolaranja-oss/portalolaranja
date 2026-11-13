// Fonte única de dados do Portal O Laranja: Supabase (tabela `news`) quando a
// integração está conectada, e o demo local como fallback (mantém o site no ar
// mesmo sem banco). O mesmo formato `Article` é usado pelo portal e pelo
// editor do painel — criar, editar e publicar alimentam a home, a página da
// categoria e a página individual automaticamente.

import { supabase } from "@/integrations/supabase/client";
import { demoArticles, type Article } from "@/data/demo";

/* ------------------------------------------------------------------ */
/* Tipos                                                              */
/* ------------------------------------------------------------------ */

export type NewsStatus = "draft" | "review" | "scheduled" | "published";

export const NEWS_STATUSES: { value: NewsStatus; label: string }[] = [
  { value: "draft", label: "Rascunho" },
  { value: "review", label: "Em revisão" },
  { value: "scheduled", label: "Agendada" },
  { value: "published", label: "Publicada" },
];

export const CATEGORY_OPTIONS = [
  "Nova Iguaçu",
  "Baixada Fluminense",
  "Rio de Janeiro",
  "Polícia",
  "Política",
  "Esportes",
  "Entretenimento",
];

export interface SeoFields {
  title: string;
  description: string;
  slug: string; // URL amigável
}

export interface ArticleFormData {
  title: string;
  subtitle: string;
  body: string; // HTML do editor
  coverImage: string;
  gallery: string[];
  category: string;
  tags: string[];
  author: string;
  source: string;
  credits: string;
  status: NewsStatus;
  scheduledAt: string; // ISO (apenas p/ status "scheduled")
  seo: SeoFields;
}

export interface NewsListItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: NewsStatus;
  updatedAt: string;
  author: string;
}

export const STATUS_STYLES: Record<
  NewsStatus,
  { label: string; className: string }
> = {
  draft: { label: "Rascunho", className: "bg-muted text-muted-foreground border border-border" },
  review: { label: "Em revisão", className: "bg-amber-500/15 text-amber-600 border border-amber-500/30" },
  scheduled: { label: "Agendada", className: "bg-sky-500/15 text-sky-600 border border-sky-500/30" },
  published: { label: "Publicada", className: "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30" },
};

export function statusLabel(s: NewsStatus | string | null | undefined): string {
  if (!s) return STATUS_STYLES.draft.label;
  return NEWS_STATUSES.find((x) => x.value === s)?.label ?? STATUS_STYLES.draft.label;
}

/* ------------------------------------------------------------------ */
/* Helpers de texto                                                    */
/* ------------------------------------------------------------------ */

export function stripHtml(html: string): string {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function excerptFrom(html: string, max = 160): string {
  const text = stripHtml(html);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

export function paragraphsFromHtml(html: string): string[] {
  if (!html) return [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  const out: string[] = [];
  doc.body.querySelectorAll("p, h1, h2, h3, li, blockquote").forEach((el) => {
    const t = (el.textContent ?? "").trim();
    if (t) out.push(t);
  });
  return out.length ? out : [stripHtml(html)];
}

/* ------------------------------------------------------------------ */
/* Mapeamento ↔ demo (fallback local)                                 */
/* ------------------------------------------------------------------ */

function articleToForm(a: Article): ArticleFormData {
  return {
    title: a.title,
    subtitle: a.excerpt,
    body: (a.body ?? []).map((p) => `<p>${p}</p>`).join("\n"),
    coverImage: a.image,
    gallery: [],
    category: a.category,
    tags: [],
    author: a.author,
    source: "",
    credits: "",
    status: "published",
    scheduledAt: "",
    seo: { title: a.title, description: a.excerpt, slug: a.slug },
  };
}

function formToArticle(id: string, f: ArticleFormData): Article {
  return {
    id,
    slug: f.seo.slug || slugify(f.title) || id,
    category: f.category || "Nova Iguaçu",
    title: f.title,
    excerpt: f.subtitle || excerptFrom(f.body),
    body: paragraphsFromHtml(f.body),
    image: f.coverImage,
    publishedAt: f.scheduledAt || new Date().toISOString(),
    author: f.author || "Redação O Laranja",
    tags: f.tags,
  } as Article;
}

export function toArticle(a: ArticleFormData, id = "tmp"): Article {
  return formToArticle(id, a);
}

/* ------------------------------------------------------------------ */
/* Camada Supabase (usa o banco + Storage já configurados)            */
/* ------------------------------------------------------------------ */

type DbNews = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  content: string;
  cover_image: string | null;
  gallery: string[] | null;
  category: string | null;
  tags: string[] | null;
  author: string | null;
  source: string | null;
  credits: string | null;
  status: NewsStatus | string | null;
  scheduled_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_slug: string | null;
  created_at: string | null;
  updated_at: string | null;
  published_at: string | null;
};

function dbToForm(d: DbNews): ArticleFormData {
  return {
    title: d.title ?? "",
    subtitle: d.subtitle ?? "",
    body: d.content ?? "",
    coverImage: d.cover_image ?? "",
    gallery: d.gallery ?? [],
    category: d.category ?? "",
    tags: d.tags ?? [],
    author: d.author ?? "",
    source: d.source ?? "",
    credits: d.credits ?? "",
    status: (d.status as NewsStatus) ?? "draft",
    scheduledAt: d.scheduled_at ?? "",
    seo: {
      title: d.seo_title ?? "",
      description: d.seo_description ?? "",
      slug: d.seo_slug ?? d.slug ?? "",
    },
  };
}

function formToDb(f: ArticleFormData) {
  const slug = f.seo.slug || slugify(f.title);
  const now = new Date().toISOString();
  return {
    slug,
    title: f.title,
    subtitle: f.subtitle,
    content: f.body,
    cover_image: f.coverImage,
    gallery: f.gallery,
    category: f.category,
    tags: f.tags,
    author: f.author,
    source: f.source,
    credits: f.credits,
    status: f.status,
    scheduled_at: f.status === "scheduled" ? f.scheduledAt || now : null,
    seo_title: f.seo.title || f.title,
    seo_description: f.seo.description || f.subtitle,
    seo_slug: slug,
    updated_at: now,
    published_at: f.status === "published" ? now : null,
  };
}

export async function saveNewsToSupabase(
  data: ArticleFormData,
  id?: string,
): Promise<{ id: string; slug: string; ok: boolean; error?: string }> {
  if (!supabase) return { id: id ?? "local", slug: data.seo.slug || slugify(data.title), ok: false, error: "supabase ausente" };
  const payload = formToDb(data);
  if (id) {
    const { error } = await supabase.from("news").update(payload).eq("id", id);
    return { id, slug: payload.slug, ok: !error, error: error?.message };
  }
  const { data: row, error } = await supabase
    .from("news")
    .insert(payload)
    .select("id, slug")
    .single();
  return { id: row?.id ?? "novo", slug: payload.slug, ok: !error, error: error?.message };
}

export async function deleteNewsSupabase(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("news").delete().eq("id", id);
  return !error;
}

/* ------------------------------------------------------------------ */
/* API pública de notícias                                            */
/* ------------------------------------------------------------------ */

const DRAFT_KEY = "ol-admin-drafts";

function localDrafts(): Record<string, Article> {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Article>) : {};
  } catch {
    return {};
  }
}

function upsertLocalDraft(article: Article): void {
  try {
    const store = localDrafts();
    store[article.id] = article;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(store));
  } catch {
    // sem storage — segue em memória
  }
}

/** Todas as notícias publicadas no portal (home, categoria, página). */
export async function getPublishedArticles(): Promise<Article[]> {
  if (supabase) {
    const { data } = await supabase
      .from("news")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });
    const rows = (data as DbNews[] | null) ?? [];
    return rows.map((d) => ({
      id: d.id,
      slug: d.slug,
      category: d.category ?? "Nova Iguaçu",
      title: d.title,
      excerpt: d.subtitle || excerptFrom(d.content),
      body: paragraphsFromHtml(d.content),
      image: d.cover_image ?? "",
      publishedAt: d.published_at ?? d.created_at ?? new Date().toISOString(),
      author: d.author ?? "Redação O Laranja",
    }) as Article);
  }
  const store = localDrafts();
  const local = Object.values(store).filter((a) => (a as { status?: NewsStatus }).status !== undefined || true);
  // no fallback, todos os artigos salvos localmente são "publicados"
  return [...local, ...demoArticles];
}

/** Lista de trabalho do painel (todos os status). */
export async function getNewsList(): Promise<NewsListItem[]> {
  if (supabase) {
    const { data } = await supabase.from("news").select("*").order("updated_at", { ascending: false });
    const rows = (data as DbNews[] | null) ?? [];
    return rows.map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      category: d.category ?? "Nova Iguaçu",
      status: ((d.status as NewsStatus) ?? "draft"),
      updatedAt: d.updated_at ?? d.created_at ?? "",
      author: d.author ?? "",
    }));
  }
  const store = localDrafts();
  return Object.values(store)
    .map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      category: a.category,
      status: "draft" as NewsStatus,
      updatedAt: a.publishedAt,
      author: a.author,
    }))
    .sort((x, y) => (y.updatedAt || "").localeCompare(x.updatedAt || ""));
}
/** Carrega uma notícia para edição (Supabase, ou fallback demo/local). */
export async function getNewsById(id: string): Promise<ArticleFormData | null> {
  if (supabase) {
    const { data } = await supabase.from("news").select("*").eq("id", id).maybeSingle();
    return data ? dbToForm(data as DbNews) : null;
  }
  // Fallback: procura no demo e nos rascunhos locais.
  const demo = demoArticles.find((a) => a.id === id);
  if (demo) return articleToForm(demo);
  const local = localDrafts()[id];
  if (local) return articleToForm(local);
  return null;
}



/**
 * Carrega as notícias publicadas para o portal (home, categoria, página,
 * busca). Combina Supabase (quando conectado) com o demo local:
 *  - `supabase` ativo: traz as publicadas do banco; o demo só preenche
 *    categorias que ainda não têm notícia no banco (mantém o portal completo).
 *  - sem Supabase: demo + rascunhos locais salvos pelo editor.
 */
export async function getPortalArticles(): Promise<Article[]> {
  const published = await getPublishedArticles();

  if (supabase) {
    const cats = new Set(published.map((a) => a.category));
    const missing = demoArticles.filter((a) => !cats.has(a.category));
    return [...published, ...missing];
  }

  // Fallback local: demo é a base; rascunhos locais salvos pelo editor.
  const local = Object.values(localDrafts());
  const bySlug = new Map<string, Article>();
  [...demoArticles, ...local].forEach((a) => bySlug.set(a.slug, a));
  return [...bySlug.values()];
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (supabase) {
    const { data } = await supabase
      .from("news")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (!data) return null;
    const d = data as DbNews;
    return {
      id: d.id,
      slug: d.slug,
      category: d.category ?? "Nova Iguaçu",
      title: d.title,
      excerpt: d.subtitle || excerptFrom(d.content),
      body: paragraphsFromHtml(d.content),
      image: d.cover_image ?? "",
      publishedAt: d.published_at ?? d.created_at ?? new Date().toISOString(),
      author: d.author ?? "Redação O Laranja",
      gallery: d.gallery ?? [],
      source: d.source ?? undefined,
      credits: d.credits ?? undefined,
    } as Article;
  }
  // Fallback: procura no demo e nos rascunhos locais.
  const all = localArticles();
  return all.find((a) => a.slug === slug) ?? null;
}

function localArticles(): Article[] {
  const local = Object.values(localDrafts());
  const bySlug = new Map<string, Article>();
  [...demoArticles, ...local].forEach((a) => bySlug.set(a.slug, a));
  return [...bySlug.values()];
}

/**
 * Cria/ativa uma notícia com o status escolhido.
 *  - Supabase: grava na tabela `news` (RLS protege por `auth.uid()`).
 *  - Fallback: salva como rascunho local e mantém o demo como conteúdo base.
 * Devolve sempre um id (do banco, ou id gerado localmente).
 */
export async function createOrUpdateNews(
  data: ArticleFormData,
  id?: string,
): Promise<{ id: string; slug: string; ok: boolean; error?: string }> {
  if (supabase) {
    return saveNewsToSupabase(data, id);
  }
  // Modo local: rascunho em localStorage
  const uid = id || `local-${Date.now()}`;
  const article = formToArticle(uid, data);
  (article as { status?: NewsStatus }).status = data.status;
  upsertLocalDraft(article);
  return { id: uid, slug: article.slug, ok: true };
}

export async function deleteNews(id: string): Promise<boolean> {
  if (supabase) return deleteNewsSupabase(id);
  try {
    const store = localDrafts();
    delete store[id];
    localStorage.setItem(DRAFT_KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

/** Publica (ou agenda) uma notícia pelo id. */
export async function setNewsStatus(
  id: string,
  status: NewsStatus,
  scheduledAt?: string,
): Promise<boolean> {
  if (supabase) {
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { status, updated_at: now };
    if (status === "published") patch.published_at = now;
    if (status === "scheduled" && scheduledAt) patch.scheduled_at = scheduledAt;
    const { error } = await supabase.from("news").update(patch).eq("id", id);
    return !error;
  }
  try {
    const store = localDrafts();
    const article = store[id];
    if (!article) return false;
    (article as { status?: NewsStatus }).status = status;
    upsertLocalDraft(article);
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Upload de imagens (Supabase Storage / fallback blob local)         */
/* ------------------------------------------------------------------ */

const BUCKET = "news-images";

/** Envia a imagem de capa/galeria e devolve a URL pública (ou blob local). */
export async function uploadNewsImage(
  file: File,
  kind: "cover" | "gallery" = "cover",
): Promise<{ url: string; ok: boolean; error?: string }> {
  if (!supabase) {
    // Sem Storage, devolve um dataURL p/ pré-visualizar; não persiste.
    const reader = new FileReader();
    return await new Promise((resolve) => {
      reader.onload = () => resolve({ url: String(reader.result), ok: true });
      reader.onerror = () => resolve({ url: "", ok: false, error: "Falha ao ler arquivo" });
      reader.readAsDataURL(file);
    });
  }
  const path = `${kind}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]+/g, "_")}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });
  if (error) return { url: "", ok: false, error: error.message };
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, ok: true };
}

export function removeNewsImage(path: string, kind: "cover" | "gallery" = "cover"): void {
  if (!supabase || !path || !path.startsWith("http")) return;
  // só remove arquivos do nosso bucket (não apaga URLs de assets do demo)
  if (!path.includes(`/${BUCKET}/`)) return;
  const key = path.split(`${BUCKET}/`)[1];
  void supabase.storage.from(BUCKET).remove([key]);
}

export const hasSupabaseClient = supabase !== null;
