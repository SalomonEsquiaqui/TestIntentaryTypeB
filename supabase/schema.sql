-- Ejecuta esto en Supabase > SQL Editor
create table if not exists tib_inventory (
  id text primary key,
  ref text not null,
  qty integer not null default 0 check (qty >= 0),
  img text default '',
  created_at timestamptz not null default now()
);
create table if not exists tib_references (
  id text primary key,
  ref text not null,
  note text default '',
  img text default '',
  created_at timestamptz not null default now()
);

alter table tib_inventory enable row level security;
alter table tib_references enable row level security;

-- El backend usa la anon key, por eso se permiten estas operaciones al rol anon.
-- Para más seguridad: agrega autenticación y restringe por auth.uid().
create policy "anon_all_inventory" on tib_inventory for all to anon using (true) with check (true);
create policy "anon_all_references" on tib_references for all to anon using (true) with check (true);
