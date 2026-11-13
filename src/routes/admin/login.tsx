import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail, LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brand } from "@/lib/brand";
import { adminSessionAsync, adminSignInAsync } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [{ title: "Login — Painel O Laranja" }],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Já logado: direto pro painel. Verifica a sessão real (Supabase ou local).
  useEffect(() => {
    adminSessionAsync().then((s) => {
      setChecking(false);
      if (s) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-sm text-muted-foreground">
        Verificando sessão…
      </div>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // Pequena pausa visual só no modo local (Supabase já tem latência real).
    await new Promise((r) => setTimeout(r, 350));
    const session = await adminSignInAsync(email, senha);
    setLoading(false);
    if (!session) {
      toast.error("Credenciais inválidas", {
        description: "Confira e-mail e senha e tente novamente.",
      });
      return;
    }
    toast.success(`Bem-vindo(a), ${session.name}!`);
    navigate({ to: "/admin" });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden lg:flex lg:flex-col lg:justify-between lg:border-r lg:border-border lg:bg-surface lg:p-12">
        <Link to="/" className="inline-flex">
          <img src={brand.logo} alt={brand.name} className="h-14 w-auto" />
        </Link>
        <div className="space-y-4">
          <h2 className="text-3xl font-extrabold leading-tight">
            Central de gerenciamento <span className="text-gradient-brand">do Portal.</span>
          </h2>
          <p className="max-w-md text-muted-foreground">
            Publique notícias, garimpa conteúdos, cuida da publicidade e acompanha as métricas de Nova Iguaçu e da Baixada Fluminense — tudo em um só lugar.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">{brand.name} • {brand.city}</p>
      </section>

      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <img src={brand.logo} alt={brand.name} className="mx-auto h-14 w-auto lg:hidden" />
            <h1 className="mt-4 text-2xl font-extrabold">Acessar o painel</h1>
            <p className="mt-1 text-sm text-muted-foreground">Entre com suas credenciais administrativas.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                E-mail
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@portalolaranja.com.br"
                  className="pl-9"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="senha" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Senha
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="senha"
                  type={showPass ? "text" : "password"}
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 pr-9"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" className="h-4 w-4 rounded border-input accent-[oklch(0.72_0.19_50)]" /> Manter conectado
            </label>

            <Button type="submit" variant="hero" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <LogIn />} {loading ? "Entrando…" : "Entrar"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary">← Voltar para o site</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
