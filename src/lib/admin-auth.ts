// Autenticação local do painel — preparada para trocar por Supabase Auth depois.
//
// Quando o Supabase for conectado ao Lovable, a troca é pontual:
//   1) Adicione @supabase/supabase-js em dependencies;
//   2) Crie o cliente em src/integrations/supabase/client.ts (o Lovable gera);
//   3) Substitua `adminSignIn` por `supabase.auth.signInWithPassword(...)`
//      e `adminSignOut` por `supabase.auth.signOut()`;
//   4) Em AdminLayout, substitua `isAdminAuthed()` por `supabase.auth.getUser()`.
// O restante do painel (guard, sidebar, logout) permanece igual.

export type AdminRole = "admin" | "editor";

export interface AdminSession {
  email: string;
  name: string;
  role: AdminRole;
  loggedInAt: string;
}

const SESSION_KEY = "ol-admin-session";

// Credencial local do administrador (fase pré-Supabase).
// Será descartado quando a auth real entrar — não use este valor em produção.
const LOCAL_ADMIN: AdminSession = {
  email: "douglas288@gmail.com",
  name: "Douglas",
  role: "admin",
  loggedInAt: "",
};

export function adminSignIn(email: string, password: string): AdminSession | null {
  const ok = email.trim().toLowerCase() === LOCAL_ADMIN.email && password === "431708243";
  if (!ok) return null;
  const session: AdminSession = { ...LOCAL_ADMIN, loggedInAt: new Date().toISOString() };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // sem storage (SSR/priv) — segue apenas em memória
  }
  return session;
}

export function adminSignOut(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignora
  }
}

export function adminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed?.email || !parsed?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isAdminAuthed(): boolean {
  return adminSession() !== null;
}

export function adminInitials(session: AdminSession | null): string {
  if (!session) return "OL";
  const parts = session.name.split(" ").slice(0, 2);
  return parts.map((p) => p[0] ?? "").join("").toUpperCase() || "OL";
}
