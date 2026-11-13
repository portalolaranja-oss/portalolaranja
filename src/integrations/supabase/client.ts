import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente Supabase do Portal O Laranja.
//
// As credenciais NÃO ficam no código: o Lovable injeta `VITE_SUPABASE_URL` e
// `VITE_SUPABASE_ANON_KEY` quando o Supabase é conectado ao projeto (Integrações).
// A chave anon é pública por design e pode viver no frontend; a chave `service_role`
// NUNCA deve aparecer aqui.
//
// Enquanto o Supabase não estiver conectado, `supabase` vale `null` e o painel
// usa o fallback local de `src/lib/admin-auth.ts`. Assim que a integração for
// conectada, o mesmo código passa a usar a auth real, sem nenhuma mudança.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

/** Indica se a integração do Supabase está ativa no build atual. */
export const hasSupabase = supabase !== null;
