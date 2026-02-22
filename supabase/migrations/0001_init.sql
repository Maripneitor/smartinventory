-- 0001_init.sql
-- SmartInventory (Supabase) - Schema base + RLS
-- Nota: si usas embeddings con otra dimensión, cambia vector(768).

begin;

-- Extensiones
create extension if not exists pgcrypto; -- gen_random_uuid()
create extension if not exists vector;   -- pgvector

-- Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'item_type_enum') then
    create type item_type_enum as enum ('device', 'accessory', 'other');
  end if;

  if not exists (select 1 from pg_type where typname = 'item_condition_enum') then
    create type item_condition_enum as enum ('new', 'used', 'defective');
  end if;
end $$;

-- Helper: updated_at automático
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

--------------------------------------------------------------------------------
-- LOCATIONS (jerárquica)
--------------------------------------------------------------------------------
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  parent_id uuid null references public.locations (id) on delete set null,

  name text not null,
  description text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- para permitir FKs compuestas seguras (id,user_id)
  constraint locations_id_user_unique unique (id, user_id)
);

create trigger trg_locations_updated_at
before update on public.locations
for each row execute function public.set_updated_at();

create index if not exists idx_locations_user_parent
on public.locations (user_id, parent_id);

--------------------------------------------------------------------------------
-- CONTAINERS (QR = id)
--------------------------------------------------------------------------------
create table if not exists public.containers (
  id uuid primary key, -- UUID del QR (lo genera el cliente o server)
  user_id uuid not null references auth.users (id) on delete cascade,

  location_id uuid not null,
  label text not null,
  qr_payload text not null, -- ej: https://tuapp.com/c/<uuid>

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint containers_id_user_unique unique (id, user_id),

  -- FK compuesta para asegurar que el location pertenece al mismo user
  constraint containers_location_user_fk
    foreign key (location_id, user_id)
    references public.locations (id, user_id)
    on delete restrict
);

create trigger trg_containers_updated_at
before update on public.containers
for each row execute function public.set_updated_at();

create index if not exists idx_containers_user_location
on public.containers (user_id, location_id);

--------------------------------------------------------------------------------
-- ITEMS (incluye "Pertenece a" + semántica)
--------------------------------------------------------------------------------
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  container_id uuid not null,

  name text not null,
  category text null,
  description text null,

  -- Storage
  photo_path text null, -- ruta en Storage (no URL pública)
  photo_mime text null,

  -- Inventario
  quantity int not null default 1,
  condition item_condition_enum not null default 'used',

  -- Tags flexibles para filtros/UX
  tags jsonb not null default '[]'::jsonb,

  -- Modelo de "Pertenencia"
  item_type item_type_enum not null default 'other',
  belongs_to_item_id uuid null, -- apunta a un item "device"

  -- Búsqueda semántica (pgvector)
  embedding vector(768) null,

  -- Búsqueda clásica (tsvector) mantenida por trigger
  search_tsv tsvector null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint items_id_user_unique unique (id, user_id),

  -- FK compuesta para asegurar que container pertenece al mismo user
  constraint items_container_user_fk
    foreign key (container_id, user_id)
    references public.containers (id, user_id)
    on delete cascade,

  -- Pertenencia: si es accessory, debe tener belongs_to_item_id.
  -- Si es device, belongs_to_item_id debe ser null.
  constraint items_belongs_logic_chk check (
    (item_type = 'accessory' and belongs_to_item_id is not null)
    or (item_type = 'device' and belongs_to_item_id is null)
    or (item_type = 'other')
  )
);

-- belongs_to apunta a items del MISMO user (FK compuesta)
alter table public.items
  add constraint items_belongs_to_user_fk
  foreign key (belongs_to_item_id, user_id)
  references public.items (id, user_id)
  on delete restrict;

create trigger trg_items_updated_at
before update on public.items
for each row execute function public.set_updated_at();

-- Trigger para search_tsv
create or replace function public.items_set_search_tsv()
returns trigger
language plpgsql
as $$
begin
  new.search_tsv :=
    to_tsvector(
      'spanish',
      coalesce(new.name,'') || ' ' ||
      coalesce(new.category,'') || ' ' ||
      coalesce(new.description,'') || ' ' ||
      coalesce(new.tags::text,'')
    );
  return new;
end;
$$;

create trigger trg_items_search_tsv
before insert or update of name, category, description, tags
on public.items
for each row execute function public.items_set_search_tsv();

-- Índices
create index if not exists idx_items_user_container
on public.items (user_id, container_id);

create index if not exists idx_items_user_type
on public.items (user_id, item_type);

create index if not exists idx_items_user_belongs
on public.items (user_id, belongs_to_item_id);

create index if not exists idx_items_category
on public.items (user_id, category);

create index if not exists idx_items_tags_gin
on public.items using gin (tags);

create index if not exists idx_items_search_tsv
on public.items using gin (search_tsv);

-- Opcional (cuando tengas embeddings): índice vectorial
-- Nota: ivfflat rinde mejor con datos suficientes y ANALYZE.
-- create index if not exists idx_items_embedding_ivfflat
-- on public.items using ivfflat (embedding vector_cosine_ops) with (lists = 100);

--------------------------------------------------------------------------------
-- ATTRIBUTES (key/value por item)
--------------------------------------------------------------------------------
create table if not exists public.attributes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  item_id uuid not null,

  key text not null,
  value text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint attributes_item_user_fk
    foreign key (item_id, user_id)
    references public.items (id, user_id)
    on delete cascade
);

create trigger trg_attributes_updated_at
before update on public.attributes
for each row execute function public.set_updated_at();

create index if not exists idx_attributes_user_item
on public.attributes (user_id, item_id);

create index if not exists idx_attributes_user_key
on public.attributes (user_id, key);

--------------------------------------------------------------------------------
-- RLS (Row Level Security)
--------------------------------------------------------------------------------
alter table public.locations  enable row level security;
alter table public.containers enable row level security;
alter table public.items      enable row level security;
alter table public.attributes enable row level security;

-- LOCATIONS policies
create policy "locations_select_own"
on public.locations for select
using (user_id = auth.uid());

create policy "locations_insert_own"
on public.locations for insert
with check (user_id = auth.uid());

create policy "locations_update_own"
on public.locations for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "locations_delete_own"
on public.locations for delete
using (user_id = auth.uid());

-- CONTAINERS policies
create policy "containers_select_own"
on public.containers for select
using (user_id = auth.uid());

create policy "containers_insert_own"
on public.containers for insert
with check (user_id = auth.uid());

create policy "containers_update_own"
on public.containers for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "containers_delete_own"
on public.containers for delete
using (user_id = auth.uid());

-- ITEMS policies
create policy "items_select_own"
on public.items for select
using (user_id = auth.uid());

create policy "items_insert_own"
on public.items for insert
with check (user_id = auth.uid());

create policy "items_update_own"
on public.items for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "items_delete_own"
on public.items for delete
using (user_id = auth.uid());

-- ATTRIBUTES policies
create policy "attributes_select_own"
on public.attributes for select
using (user_id = auth.uid());

create policy "attributes_insert_own"
on public.attributes for insert
with check (user_id = auth.uid());

create policy "attributes_update_own"
on public.attributes for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "attributes_delete_own"
on public.attributes for delete
using (user_id = auth.uid());

commit;