import { createServerFn } from "@tanstack/react-start";
import {
  type MetaCredentials,
  type MetaConnection,
  type MetaPlatform,
  type MetaPostRecord,
} from "@/lib/meta-social";

function credentialsFromBody(body: unknown): MetaCredentials {
  if (!body || typeof body !== "object") return { appId: "", appSecret: "", instagramPageId: "", facebookPageId: "" };
  const record = body as Record<string, unknown>;
  return {
    appId: String(record.appId ?? "").trim(),
    appSecret: String(record.appSecret ?? "").trim(),
    instagramPageId: String(record.instagramPageId ?? "").trim(),
    facebookPageId: String(record.facebookPageId ?? "").trim(),
  };
}

function connectionFromBody(body: unknown): MetaConnection {
  if (!body || typeof body !== "object") throw new Error("Dados de conexão Meta inválidos.");
  const record = body as Record<string, unknown>;
  return {
    platform: (record.platform === "facebook" ? "facebook" : "instagram") as MetaPlatform,
    state: (record.state === "connected" || record.state === "configured" || record.state === "disconnected" ? record.state : "disconnected") as MetaConnection["state"],
    accountLabel: String(record.accountLabel ?? ""),
    capabilities: Array.isArray(record.capabilities) ? record.capabilities.map(String) : [],
    lastCheckedAt: record.lastCheckedAt ? String(record.lastCheckedAt) : null,
  };
}

export const saveMetaConnection = createServerFn({ method: "POST" }).handler(async (request) => {
  const body = await request.json();
  const credentials = credentialsFromBody(body);
  const connection = connectionFromBody(body);
  return { credentials, connection };
});

export const scheduleMetaSocialPost = createServerFn({ method: "POST" }).handler(async (request) => {
  const body = await request.json();
  const record: MetaPostRecord = {
    id: `meta-server-${Date.now()}`,
    articleId: String((body as Record<string, unknown>)?.articleId ?? ""),
    title: String((body as Record<string, unknown>)?.title ?? ""),
    excerpt: String((body as Record<string, unknown>)?.excerpt ?? ""),
    imageUrl: String((body as Record<string, unknown>)?.imageUrl ?? ""),
    caption: String((body as Record<string, unknown>)?.caption ?? ""),
    platform: (((body as Record<string, unknown>)?.platform as MetaPlatform) ?? "instagram"),
    format: (((body as Record<string, unknown>)?.format as MetaPostRecord["format"]) ?? "ig-feed"),
    scheduledAt: (body as Record<string, unknown>)?.scheduledAt ? String((body as Record<string, unknown>).scheduledAt) : null,
    status: "scheduled",
    externalId: null,
    error: null,
    createdAt: new Date().toISOString(),
  };
  return record;
});
