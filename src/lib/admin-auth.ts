// Autenticação do painel O Laranja.
//
// Este módulo trabalha em dois modos:
//   1) SUPABASE — quando a integração está conectada no Lovable
//      (`src/integrations/supabase/client.ts` devolve um cliente != null),
//      toda a auth vira Supabase Auth real: `signInWithPassword`,
//      `getUser()` e `signOut()`. A sessão vive no cookie gerenciado pelo
//      próprio Supabase; nada de chave no código.
//   2) LOCAL (fallback) — sem Supabase conectado, usa a credencial fixa
//      abaixo + `localStorage`. Mantém o painel funcional hoje e será
//      descartada automaticamente quando o Supabase entrar.
//
// A API assíncrona (`*Async`) é o que o login e o guard do painel usam:
// funciona igual nos dois modos. As funções síncronas (adminSession,
// adminSignIn, ...) continuam exportadas para compatibilidade.

import { supabase } from "@/integrations/supabase/client";

export type AdminRole = "admin" | "editor";

export interface AdminSession {
  email: string;
  name: string;
  role: AdminRole;
  loggedInAt: string;
}

const SESSION_KEY = "ol-admin-session";

// Credencial local do administrador (somente no modo fallback, pré-Supabase).
// NUNCA use em produção: o Supabase Auth assume o lugar dela.
const LOCAL_ADMIN: AdminSession = {
  email: "douglas288@gmail.com",
  name: "Douglas",
  role: "admin",
  loggedInAt: "",
};

/* ------------------------------ modo local ------------------------------ */

function localSignIn(email: string, password: string): AdminSession | null {
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

function localSession(): AdminSession | null {
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

function localSignOut(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignora
  }
}

/* --------------------------- normaliza p/ AdminSession --------------------------- */

function fromSupabaseUser(user: { email?: string; user_metadata?: Record<string, unknown> }): AdminSession {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const role = (meta.role as AdminRole) ?? "admin";
  const name = (meta.name as string) || user.email?.split("@")[0] || "Admin";
  return {
    email: user.email ?? "",
    name,
    role,
    loggedInAt: new Date().toISOString(),
  };
}

/* ------------------------------ API pública ------------------------------ */

// --- Síncronas (compatibilidade) ---
// No modo Supabase a sessão é gerenciada por cookie; quando não há Supabase,
// estas funções leem o fallback local. Para o fluxo real use as *Async.

export function adminSession(): AdminSession | null {
  if (supabase) return null; // sessão real é assíncrona; use adminSessionAsync()
  return localSession();
}

export function adminSignIn(email: string, password: string): AdminSession | null {
  if (supabase) return null; // login real é assíncrono; use adminSignInAsync()
  return localSignIn(email, password);
}

export function adminSignOut(): void {
  if (supabase) return; // logout real é assíncrono; use adminSignOutAsync()
  localSignOut();
}

export function isAdminAuthed(): boolean {
  return adminSession() !== null;
}

export function adminInitials(session: AdminSession | null): string {
  if (!session) return "OL";
  const parts = session.name.split(" ").slice(0, 2);
  return parts.map((p) => p[0] ?? "").join("").toUpperCase() || "OL";
}

// --- Assíncronas (fluxo real, funciona nos dois modos) ---

/**
 * Autentica por e-mail/senha. Com Supabase conectado usa `signInWithPassword`
 * (a senha é verificada no backend, nunca no código). Sem Supabase, cai para
 * a credencial local de fallback.
 */
export async function adminSignInAsync(
  email: string,
  password: string,
): Promise<AdminSession | null> {
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) return null;
    return fromSupabaseUser(data.user);
  }
  return localSignIn(email, password);
}

/** Busca a sessão atual (Supabase `getUser()` ou fallback local). */
export async function adminSessionAsync(): Promise<AdminSession | null> {
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    return data.user ? fromSupabaseUser(data.user) : null;
  }
  return localSession();
}

/** Encerra a sessão (Supabase `signOut()` ou limpa o fallback local). */
export async function adminSignOutAsync(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut();
    return;
  }
  localSignOut();
}

/** Indica se há uma sessão autenticada válida (guard de rota). */
export async function isAdminAuthedAsync(): Promise<boolean> {
  return (await adminSessionAsync()) !== null;
}
