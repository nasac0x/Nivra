-- ============================================================
-- NIVRA · Schema de nuvem (rodar no SQL Editor do Supabase)
-- Cria as tabelas com RLS: cada usuário só vê e edita AS PRÓPRIAS linhas.
-- ============================================================

-- Tabela de transações financeiras
create table if not exists public.cloud_transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

-- Tabela de prospects (prospecção)
create table if not exists public.cloud_prospects (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

-- Índices por usuário (consulta rápida)
create index if not exists idx_cloud_transactions_user on public.cloud_transactions(user_id);
create index if not exists idx_cloud_prospects_user on public.cloud_prospects(user_id);

-- ============ RLS: a segurança mora AQUI, no banco ============
alter table public.cloud_transactions enable row level security;
alter table public.cloud_prospects enable row level security;

-- Cada usuário só pode ver/criar/editar/apagar as PRÓPRIAS linhas
create policy "own transactions select" on public.cloud_transactions
  for select using (auth.uid() = user_id);
create policy "own transactions insert" on public.cloud_transactions
  for insert with check (auth.uid() = user_id);
create policy "own transactions delete" on public.cloud_transactions
  for delete using (auth.uid() = user_id);

create policy "own prospects select" on public.cloud_prospects
  for select using (auth.uid() = user_id);
create policy "own prospects insert" on public.cloud_prospects
  for insert with check (auth.uid() = user_id);
create policy "own prospects delete" on public.cloud_prospects
  for delete using (auth.uid() = user_id);
