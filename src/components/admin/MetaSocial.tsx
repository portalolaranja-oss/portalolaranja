import { toast } from "sonner";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  Facebook,
  History,
  Instagram,
  KeyRound,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Textarea,
} from "@/components/ui/textarea";
import { demoArticles, type Article } from "@/data/demo";
import {
  type MetaPlatform,
  type MetaPostRecord,
  getConnection,
  getOAuthUrl,
  getMetaConnections,
  getMetaPosts,
  hasMetaIntegration,
  scheduleMetaPost,
  updateMetaPostStatus,
  verifyMetaConnection,
} from "@/lib/meta-social";
import { formatLabel, type SocialFormatKey } from "@/lib/template-presets";
import { downloadArt, type GeneratedArt } from "@/lib/template-generator";
import { generateOne } from "@/lib/template-generator";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<MetaPostRecord["status"], string> = {
  pending: "Pendente",
  scheduled: "Agendada",
  published: "Publicada",
  error: "Erro",
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function statusClass(status: MetaPostRecord["status"]) {
  if (status === "published") return "border-green-500/30 bg-green-500/10 text-green-700";
  if (status === "error") return "border-red-500/30 bg-red-500/10 text-red-700";
  if (status === "scheduled") return "border-amber-500/30 bg-amber-500/10 text-amber-700";
  return "border-blue-500/30 bg-blue-500/10 text-blue-700";
}

export function MetaSocialRoute() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<MetaPostRecord[]>(() => getMetaPosts());
  const [connections, setConnections] = useState(() => getMetaConnections());
  const [platform, setPlatform] = useState<MetaPlatform>("instagram");
  const [appId, setAppId] = useState(() => (import.meta.env.VITE_META_APP_ID ?? "").trim());
  const [appSecret, setAppSecret] = useState(() => (import.meta.env.VITE_META_APP_SECRET ?? "").trim());
  const [instagramPageId, setInstagramPageId] = useState(() => (import.meta.env.VITE_META_INSTAGRAM_PAGE_ID ?? "").trim());
  const [facebookPageId, setFacebookPageId] = useState(() => (import.meta.env.VITE_META_FACEBOOK_PAGE_ID ?? "").trim());
  const [oauthBusy, setOauthBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [articleId, setArticleId] = useState(demoArticles[0]?.id ?? "");
  const [format, setFormat] = useState<SocialFormatKey>("ig-feed");
  const [publishNow, setPublishNow] = useState(true);
  const [scheduledAt, setScheduledAt] = useState("");
  const [caption, setCaption] = useState("");
  const [generatedArt, setGeneratedArt] = useState<GeneratedArt | null>(null);
  const [historyFilter, setHistoryFilter] = useState<"all" | MetaPostRecord["status"]>("all");

  useEffect(() => {
    setConnections(getMetaConnections());
  }, []);

  const article = useMemo(() => demoArticles.find((item) => item.id === articleId) ?? demoArticles[0], [articleId]);
  const filteredPosts = useMemo(
    () => posts.filter((post) => historyFilter === "all" || post.status === historyFilter),
    [posts, historyFilter],
  );
  const calendarDays = useMemo(() => {
    const days = Array.from({ length: 31 }, (_, index) => {
      const date = new Date(2026, 10, index + 1, 12, 0, 0);
      const items = posts.filter((post) => post.scheduledAt && new Date(post.scheduledAt).getDate() === date.getDate());
      return { day: index + 1, items };
    });
    return days;
  }, [posts]);

  function syncPlatform() {
    if (platform === "facebook" && !facebookPageId) setFormat("fb-feed");
    if (platform === "instagram" && format === "fb-feed") setFormat("ig-feed");
  }

  useEffect(syncPlatform, [platform, format, facebookPageId]);

  async function autoFillCaption() {
    const base = article.excerpt || article.subtitle || "Confira mais detalhes no Portal O Laranja.";
    const draft = `${article.title}\n${base}\n\n#PortalOLaranja ${article.category.replace(/\s+/g, "")} #NovaIguaçu`;
    setCaption(draft);
  }

  async function saveCredentials() {
    const next = `VITE_META_APP_ID=${appId} VITE_META_APP_SECRET=${appSecret} VITE_META_INSTAGRAM_PAGE_ID=${instagramPageId} VITE_META_FACEBOOK_PAGE_ID=${facebookPageId}`;
    try {
      sessionStorage.setItem("ol-meta-social-credentials", next);
    } catch {
      // Sem storage: o usuário mantém os campos preenchidos na aba atual.
    }
    setConnections(getMetaConnections());
    toast.success("Credenciais Meta configuradas.", {
      description: "Em produção, o app secreto deve ficar apenas no backend e os endpoints oficiais devem ser acionados por esse backend.",
    });
  }

  async function connectAccount() {
    const oauth = getOAuthUrl(platform);
    if (!oauth) {
      toast.error("Preencha App ID e App Secret para iniciar o OAuth da Meta.", {
        description: "O fluxo oficial usa a permissão pages_manage_posts e, para Instagram, instagram_basic via Page API.",
      });
      return;
    }
    setOauthBusy(true);
    try {
      window.open(oauth, "meta_oauth", "width=520,height=640");
      toast.info("Janela da Meta aberta.", { description: "Depois do login, salve as credenciais e verifique a conexão." });
    } finally {
      setOauthBusy(false);
    }
  }

  async function verify() {
    setVerifyBusy(true);
    try {
      const result = await verifyMetaConnection(platform).catch((error) => {
        toast.error("Falha na verificação Meta.", { description: error instanceof Error ? error.message : "Tente novamente." });
        return getConnection(platform);
      });
      setConnections(getMetaConnections().map((item) => (item.platform === result.platform ? result : item)));
      if (result.state === "connected") toast.success("Conta Meta verificada.", { description: result.accountLabel });
    } finally {
      setVerifyBusy(false);
    }
  }

  async function publish() {
    setBusy(true);
    try {
      const art = await generateOne({
        article: { ...article, title: article.title || "Notícia O Laranja", image: article.image },
        format,
        style: "editorial",
      });
      setGeneratedArt(art);
      const record = await scheduleMetaPost({
        article,
        platform,
        format,
        imageUrl: art.dataUrl,
        caption: caption.trim() || `#${article.category.replace(/\s+/g, "")} ${article.title}`,
        scheduledAt: publishNow ? null : scheduledAt ? new Date(scheduledAt).toISOString() : null,
      });
      const nextPosts = record.status === "published" || record.status === "error" ? [record, ...posts] : posts;
      setPosts(nextPosts);
      if (record.status === "published") {
        toast.success("Publicação registrada.", { description: record.externalId ? `ID ${record.externalId}` : "A publicação saiu para a plataforma conectada." });
      } else if (record.status === "error") {
        toast.error("A publicação não foi concluída.", { description: record.error ?? "Veja o histórico para detalhes do erro." });
      } else {
        toast.success("Publicação preparada no calendário.", {
          description: record.error ?? "Sem autorização Meta, baixe a arte para publicar manualmente.",
        });
      }
    } catch (error) {
      toast.error("Não foi possível preparar a publicação.", { description: error instanceof Error ? error.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  function markManual(post: MetaPostRecord) {
    const updated = updateMetaPostStatus(post.id, { status: "published", error: "Publicação manual registrada pela equipe." });
    setPosts(updated);
    toast.success("Histórico atualizado.", { description: "A arte foi marcada como publicada manualmente." });
  }

  const currentConnection = connections.find((item) => item.platform === platform) ?? getConnection(platform);

  return (
    <AdminLayout current="/admin/redes" title="Redes sociais" description="Conecte Instagram e Facebook com a API oficial da Meta, publique e agende conteúdos.">
      <section className="grid gap-4 md:grid-cols-2">
        {connections.map((connection) => {
          const Icon = connection.platform === "instagram" ? Instagram : Facebook;
          return (
            <Card key={connection.platform} className={cn("border", connection.state === "connected" && "border-green-500/30", connection.state === "configured" && "border-amber-500/30")}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {connection.platform === "instagram" ? "Instagram profissional" : "Página do Facebook"}
                </CardTitle>
                <span className={cn("text-xs font-semibold", connection.state === "connected" ? "text-green-600" : connection.state === "configured" ? "text-amber-600" : "text-muted-foreground")}>
                  {connection.state === "connected" ? "Conectada" : connection.state === "configured" ? "Configurada" : "Desconectada"}
                </span>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">{connection.accountLabel}</p>
                <p className="text-xs text-muted-foreground">Verificada: {formatDateTime(connection.lastCheckedAt)}</p>
                <div className="flex flex-wrap gap-1 text-xs">
                  {connection.capabilities.map((capability) => (
                    <span key={capability} className="rounded-full border border-border bg-surface px-2 py-1 text-muted-foreground">
                      {capability}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Separator className="my-6" />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Credenciais oficiais Meta</CardTitle>
          <CardDescription>As chaves alimentam o OAuth e a Graph API. Em produção, o app secret deve ser mantido apenas no backend.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="meta-app-id">Meta App ID</Label>
              <Input id="meta-app-id" value={appId} onChange={(event) => setAppId(event.target.value)} placeholder="ID da aplicação na Meta" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta-app-secret">Meta App Secret / Token</Label>
              <Input id="meta-app-secret" type="password" value={appSecret} onChange={(event) => setAppSecret(event.target.value)} placeholder="Somente no servidor em produção" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta-ig-page-id">Instagram Business / Page ID</Label>
              <Input id="meta-ig-page-id" value={instagramPageId} onChange={(event) => setInstagramPageId(event.target.value)} placeholder="ID da Page vinculada ao Instagram" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta-fb-page-id">Facebook Page ID</Label>
              <Input id="meta-fb-page-id" value={facebookPageId} onChange={(event) => setFacebookPageId(event.target.value)} placeholder="ID da Página do Facebook" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void saveCredentials()} variant="hero" size="sm">
              <ShieldCheck className="mr-1.5 h-4 w-4" /> Salvar credenciais
            </Button>
            <Button onClick={() => void connectAccount()} variant="outline" size="sm" disabled={oauthBusy}>
              {oauthBusy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-1.5 h-4 w-4" />}
              {platform === "instagram" ? "Conectar Instagram" : "Conectar Facebook"}
            </Button>
            <Button onClick={() => void verify()} variant="outline" size="sm" disabled={verifyBusy}>
              {verifyBusy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
              Verificar conexão
            </Button>
            {!hasMetaIntegration() && (
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/admin/templates" })}>
                <Download className="mr-1.5 h-4 w-4" /> Usar download manual
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Send className="h-4 w-4" /> Publicar ou agendar</CardTitle>
            <CardDescription>A legenda já traz título e resumo. Escolha a imagem gerada e o formato da arte.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="meta-article">Notícia</Label>
                <select id="meta-article" value={articleId} onChange={(event) => setArticleId(event.target.value)} className="h-9 w-full rounded-md border border-input bg-surface px-3 text-sm">
                  {demoArticles.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Formato</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["ig-feed", "ig-story", "fb-feed"] as const).map((key) => (
                    <button key={key} type="button" onClick={() => setFormat(key)} className={cn("rounded-md border px-2 py-2 text-xs", format === key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>
                      {formatLabel(key)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Destino</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant={platform === "instagram" ? "hero" : "outline"} size="sm" onClick={() => setPlatform("instagram")}>
                  <Instagram className="mr-1.5 h-4 w-4" /> Instagram
                </Button>
                <Button variant={platform === "facebook" ? "hero" : "outline"} size="sm" onClick={() => setPlatform("facebook")}>
                  <Facebook className="mr-1.5 h-4 w-4" /> Facebook
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta-caption">Legenda automática</Label>
              <Textarea id="meta-caption" value={caption} onChange={(event) => setCaption(event.target.value)} rows={5} />
              <Button variant="outline" size="sm" onClick={() => void autoFillCaption()}>
                Gerar legenda
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-lg border border-border p-3">
                <input type="radio" checked={publishNow} onChange={() => setPublishNow(true)} />
                <span className="text-sm">Publicar agora</span>
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-border p-3">
                <input type="radio" checked={!publishNow} onChange={() => setPublishNow(false)} />
                <span className="flex-1 text-sm">Agendar</span>
                <Input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="h-8 w-44" />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void publish()} variant="hero" disabled={busy || !caption.trim()}>
                {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
                {publishNow ? "Publicar" : "Agendar publicação"}
              </Button>
              {generatedArt && (
                <Button variant="outline" onClick={() => downloadArt(generatedArt, "ol-social")}>
                  <Download className="mr-1.5 h-4 w-4" /> Baixar arte
                </Button>
              )}
            </div>
            {generatedArt && (
              <div className="rounded-lg border border-border p-3">
                <img src={generatedArt.dataUrl} alt="Arte selecionada" className="mx-auto max-h-56 rounded-md" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Calendário de conteúdos</CardTitle>
            <CardDescription>Novembro 2026 — conteúdos agendados ou publicados.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-7 gap-2 text-xs">
              {calendarDays.map((day) => (
                <div key={day.day} className={cn("rounded-lg border p-2", day.items.length ? "border-primary/40 bg-primary/10" : "border-border")}>
                  <p className="font-bold">{day.day}</p>
                  <p className="text-muted-foreground">{day.items.length ? `${day.items.length} post(s)` : "Livre"}</p>
                </div>
              ))}
            </div>
            <div className="max-h-64 overflow-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Conteúdo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.slice(0, 8).map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <p className="truncate text-sm font-medium">{post.title}</p>
                        <p className="text-xs text-muted-foreground">{formatLabel(post.format)} · {post.platform}</p>
                      </TableCell>
                      <TableCell>
                        <span className={cn("rounded-full border px-2 py-1 text-xs", statusClass(post.status))}>{STATUS_LABEL[post.status]}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2"><History className="h-4 w-4" /> Histórico</CardTitle>
              <CardDescription>Status pendente, agendada, publicada e erro.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Button size="sm" variant={historyFilter === "all" ? "hero" : "outline"} onClick={() => setHistoryFilter("all")}>Todos</Button>
              <Button size="sm" variant={historyFilter === "pending" ? "hero" : "outline"} onClick={() => setHistoryFilter("pending")}>Pendentes</Button>
              <Button size="sm" variant={historyFilter === "scheduled" ? "hero" : "hero"} onClick={() => setHistoryFilter("scheduled")}>Agendadas</Button>
              <Button size="sm" variant={historyFilter === "published" ? "hero" : "outline"} onClick={() => setHistoryFilter("published")}>Publicadas</Button>
              <Button size="sm" variant={historyFilter === "error" ? "hero" : "outline"} onClick={() => setHistoryFilter("error")}>Erros</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
              <TriangleAlert className="mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-semibold">Nenhuma publicação encontrada</p>
              <p className="text-xs text-muted-foreground">Use o painel para publicar ou agendar.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Notícia</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Formato</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <p className="text-sm font-medium">{post.title}</p>
                      <p className="text-xs text-muted-foreground">{post.externalId ? `ID ${post.externalId}` : post.error ?? "—"}</p>
                    </TableCell>
                    <TableCell>{post.platform === "instagram" ? "Instagram" : "Facebook"}</TableCell>
                    <TableCell>{formatLabel(post.format)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {post.status === "pending" && (
                          <Button size="sm" variant="outline" onClick={() => markManual(post)}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Manual
                          </Button>
                        )}
                        {post.status === "published" && <Clock3 className="h-4 w-4 text-green-600" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn("rounded-full border px-2 py-1 text-xs", statusClass(post.status))}>{STATUS_LABEL[post.status]}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

export { X };
