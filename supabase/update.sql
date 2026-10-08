-- Tester Invetary B | Actualización v2: categorías, subcategorías y tallas
-- Ejecutar en Supabase > SQL Editor (se puede repetir sin problema)

-- 1) Nuevas columnas
alter table public.tib_inventory
  add column if not exists category    text not null default '',
  add column if not exists subcategory text not null default '',
  add column if not exists size        text not null default '';
alter table public.tib_references
  add column if not exists category    text not null default '',
  add column if not exists subcategory text not null default '';

-- 2) Tabla de categorías (parent vacío = categoría, parent con id = subcategoría)
create table if not exists public.tib_categories (
  id         text primary key,
  name       text not null,
  parent     text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tib_cat_name_len check (char_length(btrim(name)) between 1 and 40),
  constraint tib_cat_id_len   check (char_length(id) between 1 and 64)
);

-- 3) Validaciones de longitud
alter table public.tib_inventory drop constraint if exists tib_inv_cat_len;
alter table public.tib_inventory add constraint tib_inv_cat_len
  check (char_length(category) <= 40 and char_length(subcategory) <= 40 and char_length(size) <= 12);
alter table public.tib_references drop constraint if exists tib_ref_cat_len;
alter table public.tib_references add constraint tib_ref_cat_len
  check (char_length(category) <= 40 and char_length(subcategory) <= 40);

-- 4) Índices para filtrar y ordenar rápido
create index if not exists tib_inv_cat_idx  on public.tib_inventory  (category, subcategory);
create index if not exists tib_inv_size_idx on public.tib_inventory  (size);
create index if not exists tib_ref_cat_idx  on public.tib_references (category, subcategory);
create index if not exists tib_cat_par_idx  on public.tib_categories (parent);

-- 5) updated_at automático
drop trigger if exists tib_cat_touch on public.tib_categories;
create trigger tib_cat_touch before update on public.tib_categories
  for each row execute function public.tib_touch_updated_at();

-- 6) Seguridad (RLS) igual que las otras tablas
alter table public.tib_categories enable row level security;
alter table public.tib_categories force  row level security;
revoke all on public.tib_categories from anon, authenticated;
grant select, insert, update, delete on public.tib_categories to anon;
drop policy if exists "cat_select" on public.tib_categories;
drop policy if exists "cat_insert" on public.tib_categories;
drop policy if exists "cat_update" on public.tib_categories;
drop policy if exists "cat_delete" on public.tib_categories;
create policy "cat_select" on public.tib_categories for select to anon using (true);
create policy "cat_insert" on public.tib_categories for insert to anon with check (true);
create policy "cat_update" on public.tib_categories for update to anon using (true) with check (true);
create policy "cat_delete" on public.tib_categories for delete to anon using (true);
