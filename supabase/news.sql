-- ============================================================
--  Portal O Laranja — schema do Supabase
--  Rode este SQL no editor SQL do Supabase (ou `supabase db push`).
--  Cria a tabela `news` + bucket de storage `news-images` + RLS.
--
--  IMPORTANTE: não duplica tabelas existentes. Se a tabela `news`
--  já existir, rode apenas o bloco de STORAGE + RLS (finais do
--  arquivo) e ignore a criação da tabela.
-- ============================================================

-- 1) Tabela de notícias ------------------------------------------------
create table if not exists public.news (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  subtitle      text default '',
  content       text default '',            -- HTML do editor
  cover_image   text,
  gallery       jsonb default '[]'::jsonb,  -- array de URLs
  category      text default 'Nova Iguaçu',
  tags          jsonb default '[]'::jsonb,
  author        text default 'Redação O Laranja',
  source        text default '',
  credits       text default '',
  status        text not null default 'draft'
                check (status in ('draft','review','scheduled','published')),
  scheduled_at  timestamptz,
  seo_title     text,
  seo_description text,
  seo_slug      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  published_at  timestamptz
);

create index if not exists news_status_idx on public.news (status);
create index if not exists news_category_idx on public.news (category);
create index if not exists news_published_at_idx on public.news (published_at desc);
create index if not exists news_updated_at_idx on public.news (updated_at desc);

-- Atualiza updated_at automaticamente a cada escrita.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists news_set_updated_at on public.news;
create trigger news_set_updated_at
  before update on public.news
  for each row execute function public.set_updated_at();

-- 2) Row Level Security ------------------------------------------------
alter table public.news enable row level security;

-- Leitura pública apenas de notícias publicadas (alimenta o portal).
drop policy if exists "news_public_read" on public.news;
create policy "news_public_read" on public.news
  for select using (status = 'published' or auth.role() = 'authenticated');

-- Escrita (inserir/atualizar/excluir) só para autenticados.
drop policy if exists "news_authenticated_write" on public.news;
create policy "news_authenticated_write" on public.news
  for all to authenticated using (true) with check (true);

-- 3) Storage bucket para imagens de capa e galeria --------------------
insert into storage.buckets (id, name, public)
values ('news-images', 'news-images', true)
on conflict (id) do nothing;

drop policy if exists "news_images_public_read" on storage.objects;
create policy "news_images_public_read" on storage.objects
  for select using (bucket_id = 'news-images');

-- Uploads apenas de autenticados.
drop policy if exists "news_images_authenticated_write" on storage.objects;
create policy "news_images_authenticated_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'news-images');

drop policy if exists "news_images_authenticated_delete" on storage.objects;
create policy "news_images_authenticated_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'news-images');

-- 4) (Opcional) seed do admin — o usuário de login já deve existir em
--    Authentication > Users. Aqui apenas garante o papel admin.
-- insert into public.profiles (email, name, role)
-- values ('douglas288@gmail.com','Douglas','admin')
-- on conflict do nothing;
