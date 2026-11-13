// Integração segura com Instagram e Facebook usando endpoints oficiais da Meta.
// Os tokens de serviço ficam em variáveis do servidor/ambiente e não no código.

import type { Article } from "@/data/demo";
import type { SocialFormatKey } from "@/lib/template-presets";

export type MetaPlatform = "instagram" | "facebook";
export type MetaPostStatus = "pending" | "scheduled" | "published" | "error";
export type MetaConnectionState = "disconnected" | "configured" | "connected";

export interface MetaConnection {
  platform: MetaPlatform;
  state: MetaConnectionState;
  accountLabel: string;
  capabilities: string[];
  lastCheckedAt: string | null;
}

export interface MetaPostRecord {
  id: string;
  articleId: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  caption: string;
  platform: MetaPlatform;
  format: SocialFormatKey;
  scheduledAt: string | null;
  status: MetaPostStatus;
  externalId: string | null;
  error: string | null;
  createdAt: string;
}

export interface MetaCredentials {
  appId: string;
  appSecret: string;
  instagramPageId: string;
  facebookPageId: string;
}

const CONFIG_KEY = "ol-meta-social-config";
const POSTS_KEY = "ol-meta-social-posts";
const MAX_POSTS = 100;

function envString(name: string): string {
  const env = import.meta.env as Record<string, string | undefined>;
  return (env[name] ?? "").trim();
}

function credentialsFromEnv(): MetaCredentials {
  const appId = envString("VITE_META_APP_ID");
  const instagramPageId = envString("VITE_META_INSTAGRAM_PAGE_ID");
  const facebookPageId = envString("VITE_META_FACEBOOK_PAGE_ID");
  return {
    appId,
    appSecret: "",
    instagramPageId: instagramPageId || facebookPageId,
    facebookPageId: facebookPageId || instagramPageId,
  };
}

function loadConfig(): MetaCredentials {
  return credentialsFromEnv();
}

function loadPosts(): MetaPostRecord[] {
  try {
    const raw = localStorage.getItem(POSTS_KEY);
    return raw ? (JSON.parse(raw) as MetaPostRecord[]) : [];
  } catch {
    return [];
  }
}

function savePosts(posts: MetaPostRecord[]) {
  try {
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  } catch {
    // Sem storage, o calendário segue em memória na aba atual.
  }
}

function token(): string {
  const config = loadConfig();
  return config.appId && config.appSecret ? `${config.appId}|${config.appSecret}` : "";
}

function apiUrl(path: string): string {
  return path.startsWith("http") ? path : `https://graph.facebook.com/v21.0/${path}`;
}

function hasMetaCredentials(): boolean {
  const config = loadConfig();
  return Boolean(config.appId && config.appSecret && (config.instagramPageId || config.facebookPageId));
}

function oauthUrl(platform: MetaPlatform): string | null {
  const config = loadConfig();
  if (!config.appId || !config.appSecret) return null;
  const scope =
    platform === "instagram"
      ? "instagram_basic,pages_read_engagement,pages_manage_posts"
      : "pages_read_engagement,pages_manage_posts,pages_show_list";
  const redirect = encodeURIComponent(window.location.origin + "/admin/redes");
  return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${config.appId}&redirect_uri=${redirect}&scope=${scope}`;
}

function pageIdFor(platform: MetaPlatform): string {
  const config = loadConfig();
  return platform === "instagram" ? config.instagramPageId : config.facebookPageId;
}

function platformState(platform: MetaPlatform): MetaConnection {
  const config = loadConfig();
  const hasCreds = Boolean(config.appId && config.appSecret && pageIdFor(platform));
  const state: MetaConnectionState = hasCreds ? "configured" : "disconnected";
  const label =
    platform === "instagram"
      ? config.instagramPageId || config.facebookPageId || "Instagram profissional"
      : config.facebookPageId || "Página do Facebook";
  return {
    platform,
    state,
    accountLabel: label,
    capabilities: ["publicar", "agendar", "histórico"],
    lastCheckedAt: hasCreds ? new Date().toISOString() : null,
  };
}

export function getConnection(platform: MetaPlatform): MetaConnection {
  return platformState(platform);
}

export function hasMetaIntegration(): boolean {
  return hasMetaCredentials();
}

export function getMetaConnections(): MetaConnection[] {
  return ["instagram", "facebook"].map(platformState) as MetaConnection[];
}

export function getOAuthUrl(platform: MetaPlatform): string | null {
  return oauthUrl(platform);
}

export async function verifyMetaConnection(platform: MetaPlatform): Promise<MetaConnection> {
  const base = platformState(platform);
  if (!token() || !pageIdFor(platform)) return base;

  try {
    const res = await fetch(apiUrl(`${pageIdFor(platform)}?fields=id,name&access_token=${encodeURIComponent(token())}`));
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message ?? "Falha ao verificar a conta Meta.");
    base.state = "connected";
    base.accountLabel = data.name ?? base.accountLabel;
    base.lastCheckedAt = new Date().toISOString();
    return base;
  } catch (error) {
    base.state = "configured";
    base.lastCheckedAt = new Date().toISOString();
    throw error;
  }
}

function buildCaption(article: Article, excerpt: string, format: SocialFormatKey): string {
  const lines = [
    article.title.trim(),
    excerpt.trim() && excerpt !== article.title.trim() ? excerpt.trim() : "",
    "",
    `#${slugTag(article.category)}`,
    "@portalolaranja",
  ].filter(Boolean);
  const suffix = format === "ig-story" ? " #story" : "";
  return lines.join("\n").slice(0, 2200 - suffix.length) + suffix;
}

function slugTag(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^|(?<=[a-z])(?=[A-Z0-9])/g, "");
}

function dataUrlToBlob(dataUrl: string): Blob {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: "image/png" });
}

async function uploadImage(platform: MetaPlatform, dataUrl: string, caption: string): Promise<string> {
  const fileId = `image-${Date.now()}.png`;
  const page = pageIdFor(platform);
  const boundary = `ol-${Date.now()}`;
  const form = new FormData();
  form.append("access_token", token());
  form.append("file", dataUrlToBlob(dataUrl), fileId);
  form.append("caption", caption);

  const res = await fetch(apiUrl(`${page}/photos`), {
    method: "POST",
    headers: { "content-type": "multipart/form-data; boundary=" + boundary },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? "Falha ao enviar imagem para a Meta.");
  return data.post_id ?? data.id ?? "";
}

async function publishMetaPost(
  platform: MetaPlatform,
  pageId: string,
  imageUrl: string,
  caption: string,
  scheduledAt: string | null,
): Promise<string> {
  if (scheduledAt) {
    const res = await fetch(
      apiUrl(
        `${pageId}/publish?message=${encodeURIComponent(caption)}&data=${encodeURIComponent(JSON.stringify({ scheduled_timestamp: Math.floor(new Date(scheduledAt).getTime() / 1000), source_media_id: imageUrl }))}&access_token=${encodeURIComponent(token())}`,
      ),
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message ?? "Falha ao agendar publicação.");
    return data.id ?? "";
  }

  if (platform === "instagram") {
    const containerRes = await fetch(apiUrl(`${pageId}/containers?access_token=${encodeURIComponent(token())}`));
    const container = await containerRes.json();
    if (!containerRes.ok) throw new Error(container?.error?.message ?? "Falha ao criar container do Instagram.");
    const containerId = container.id as string;

    const publishRes = await fetch(
      apiUrl(
        `${containerId}/publish?url=${encodeURIComponent(imageUrl)}&access_token=${encodeURIComponent(token())}`,
      ),
    );
    const publishData = await publishRes.json();
    if (!publishRes.ok) throw new Error(publishData?.error?.message ?? "Falha ao publicar no Instagram.");
    return publishData.id ?? "";
  }

  return uploadImage(platform, imageUrl, caption);
}

export interface SchedulePostInput {
  article: Article;
  platform: MetaPlatform;
  format: SocialFormatKey;
  imageUrl: string;
  caption: string;
  scheduledAt: string | null;
}

function metaPostError(platform: MetaPlatform, format: SocialFormatKey, caption: string, scheduledAt: string | null, imageUrl: string): MetaPostRecord {
  return {
    id: `meta-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    articleId: "",
    title: "",
    excerpt: "",
    imageUrl,
    caption,
    platform,
    format,
    scheduledAt,
    status: "pending",
    externalId: null,
    error: "Publicação manual — credenciais autorizadas não configuradas no backend.",
    createdAt: new Date().toISOString(),
  };
}

export async function scheduleMetaPost(input: SchedulePostInput): Promise<MetaPostRecord> {
  const record: MetaPostRecord = {
    id: `meta-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    articleId: input.article.id,
    title: input.article.title,
    excerpt: input.article.excerpt ?? input.article.subtitle ?? "",
    imageUrl: input.imageUrl,
    caption: input.caption,
    platform: input.platform,
    format: input.format,
    scheduledAt: input.scheduledAt,
    status: "scheduled",
    externalId: null,
    error: null,
    createdAt: new Date().toISOString(),
  };

  if (!hasMetaCredentials()) {
    record.status = "pending";
    record.error = "Credenciais Meta não configuradas — mantida no calendário para publicação manual.";
  } else if (!token() || !pageIdFor(input.platform)) {
    record.status = "pending";
    record.error = "Página da Meta não configurada — complete as credenciais para publicar.";
  } else {
    try {
      const externalId = await publishMetaPost(input.platform, pageIdFor(input.platform), input.imageUrl, input.caption, input.scheduledAt);
      record.status = "published";
      record.externalId = externalId;
    } catch (error) {
      record.status = "error";
      record.error = error instanceof Error ? error.message : "Erro ao publicar na Meta.";
    }
  }

  const posts = [record, ...loadPosts()].slice(0, MAX_POSTS);
  savePosts(posts);
  return record;
}

export function getMetaPosts(): MetaPostRecord[] {
  return loadPosts();
}

export function createManualMetaPost(input: {
  articleId: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  caption: string;
  platform: MetaPlatform;
  format: SocialFormatKey;
  scheduledAt: string | null;
}): MetaPostRecord {
  const record: MetaPostRecord = {
    id: `meta-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    articleId: input.articleId,
    title: input.title,
    excerpt: input.excerpt,
    imageUrl: input.imageUrl,
    caption: input.caption,
    platform: input.platform,
    format: input.format,
    scheduledAt: input.scheduledAt,
    status: "pending",
    externalId: null,
    error: "Aguardando publicação manual — sem conexão Meta autorizada.",
    createdAt: new Date().toISOString(),
  };
  const posts = [record, ...loadPosts()].slice(0, MAX_POSTS);
  savePosts(posts);
  return record;
}

export function updateMetaPostStatus(id: string, patch: Partial<MetaPostRecord>): MetaPostRecord[] {
  const posts = loadPosts();
  const idx = posts.findIndex((p) => p.id === id);
  if (idx < 0) return posts;
  posts[idx] = { ...posts[idx], ...patch };
  savePosts(posts);
  return posts;
}

export function deleteMetaPost(id: string): MetaPostRecord[] {
  const posts = loadPosts().filter((p) => p.id !== id);
  savePosts(posts);
  return posts;
}

export function buildDefaultCaption(article: Article, format: SocialFormatKey): string {
  return buildCaption(article, article.excerpt ?? article.subtitle ?? "", format);
}
