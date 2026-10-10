/**
 * Camada Supabase do Nivra — opcional e degradável.
 *
 * CONCEITO (importante pra quem tá aprendendo):
 * - Sem credenciais no .env.local → o app funciona 100% no localStorage,
 *   como sempre funcionou. Nada quebra.
 * - Com credenciais → login por email/senha, dados no Postgres (nuvem),
 *   sincronizados entre PC e celular. O localStorage vira cache offline.
 *
 * SEGURANÇA: a SUPABASE_URL e a SUPABASE_ANON_KEY abaixo do front NÃO são
 * senha. A senha (hash) mora no Supabase Auth, longe do navegador. O que
 * protege os dados é RLS (Row Level Security): regras no banco que só
 * deixam cada usuário ler/gravar AS LINHAS DELE, quando logado. A anon key
 * "fala" com o banco, mas o banco só responde ao dono autenticado.
 *
 * SETUP (ver README-SUPABASE.md): criar projeto free em supabase.com,
 * rodar o SQL do arquivo supabase/schema.sql no SQL Editor, e preencher
 * .env.local com NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */

import { createClient, Session, User } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** true quando o app está configurado pra usar a nuvem. */
export const isCloudConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** Cliente Supabase singleton — null quando não configurado. */
export const supabase = isCloudConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

export type CloudUser = {
  id: string;
  email: string;
};

export function toCloudUser(user: User | null): CloudUser | null {
  if (!user) return null;
  return { id: user.id, email: user.email ?? '' };
}

// ============================================================
// AUTH
// ============================================================

export async function cloudSignUp(email: string, password: string) {
  if (!supabase) throw new Error('Nuvem não configurada.');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return toCloudUser(data.user);
}

export async function cloudSignIn(email: string, password: string) {
  if (!supabase) throw new Error('Nuvem não configurada.');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return toCloudUser(data.user);
}

export async function cloudSignOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function cloudGetCurrentUser(): Promise<CloudUser | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return toCloudUser(data.session?.user ?? null);
}

/** Assina mudanças de sessão (login/logout em outra aba, refresh do token). */
export function onCloudAuthChange(cb: (user: CloudUser | null) => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
    cb(toCloudUser(session?.user ?? null));
  });
  return () => data.subscription.unsubscribe();
}

// ============================================================
// TRANSAÇÕES (tabela cloud_transactions)
// ============================================================

export async function cloudFetchTransactions(userId: string): Promise<Record<string, unknown>[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('cloud_transactions')
    .select('payload')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.payload as Record<string, unknown>);
}

export async function cloudPushTransactions(
  userId: string,
  transactions: Record<string, unknown>[]
): Promise<void> {
  if (!supabase || transactions.length === 0) return;
  // Estratégia simples e robusta: apaga tudo que é do usuário e reinsere.
  // Pra volume pessoal (centenas/milhares de linhas) é instantâneo e evita
  // lógica de diff. RLS garante que só o dono toca nas próprias linhas.
  const { error: delErr } = await supabase
    .from('cloud_transactions')
    .delete()
    .eq('user_id', userId);
  if (delErr) throw delErr;

  const rows = transactions.map((t) => ({ user_id: userId, payload: t }));
  const { error: insErr } = await supabase.from('cloud_transactions').insert(rows);
  if (insErr) throw insErr;
}

// ============================================================
// PROSPECTS (tabela cloud_prospects)
// ============================================================

export async function cloudFetchProspects(userId: string): Promise<Record<string, unknown>[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('cloud_prospects')
    .select('payload')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.payload as Record<string, unknown>);
}

export async function cloudPushProspects(
  userId: string,
  prospects: Record<string, unknown>[]
): Promise<void> {
  if (!supabase || prospects.length === 0) return;
  const { error: delErr } = await supabase
    .from('cloud_prospects')
    .delete()
    .eq('user_id', userId);
  if (delErr) throw delErr;

  const rows = prospects.map((p) => ({ user_id: userId, payload: p }));
  const { error: insErr } = await supabase.from('cloud_prospects').insert(rows);
  if (insErr) throw insErr;
}

// ============================================================
// SINCRONIZAÇÃO (o coração do modo nuvem)
// ============================================================

/**
 * Fluxo: local é a fonte da verdade durante o uso; ao salvar, empurra pra
 * nuvem (debounce curto). Ao LOGAR, nuvem ganha se tiver mais dados que o
 * local (primeiro acesso no celular), senão o local sobe (migração inicial).
 */

export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number) {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args: unknown[]) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
