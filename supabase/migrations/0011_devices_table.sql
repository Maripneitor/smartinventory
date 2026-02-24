-- 0011_devices_table.sql
-- Create a dedicated devices table for better hierarchy

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  
  name text not null,
  description text null,
  model text null,
  brand text null,
  
  photo_path text null,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  constraint devices_id_user_unique unique (id, user_id)
);

-- Add device_id to items
alter table public.items 
add column if not exists belongs_to_device_id uuid null;

-- Add FK with user safety
alter table public.items
add constraint items_device_user_fk
foreign key (belongs_to_device_id, user_id)
references public.devices (id, user_id)
on delete set null;

-- Enable RLS for devices
alter table public.devices enable row level security;

create policy "devices_all_own"
on public.devices for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Trigger for updated_at
create trigger trg_devices_updated_at
before update on public.devices
for each row execute function public.set_updated_at();

-- Index for performance
create index if not exists idx_items_device_id on public.items (belongs_to_device_id);
