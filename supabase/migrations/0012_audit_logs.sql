-- 0012_audit_logs.sql
-- Create history table to track movements and changes

create table if not exists public.inventory_logs (
    id uuid primary key default gen_random_uuid(),
    item_id uuid not null,
    user_id uuid not null references auth.users (id),
    action text not null, -- 'INSERT', 'UPDATE', 'DELETE'
    old_data jsonb,
    new_data jsonb,
    created_at timestamptz not null default now()
);

alter table public.inventory_logs enable row level security;

create policy "inventory_logs_select_own" on public.inventory_logs
    for select using (user_id = auth.uid());

-- Trigger function to log item changes
create or replace function public.log_item_changes()
returns trigger
language plpgsql
as $$
begin
    if (TG_OP = 'INSERT') then
        insert into public.inventory_logs (item_id, user_id, action, new_data)
        values (new.id, new.user_id, 'INSERT', to_jsonb(new));
        return new;
    elsif (TG_OP = 'UPDATE') then
        insert into public.inventory_logs (item_id, user_id, action, old_data, new_data)
        values (new.id, new.user_id, 'UPDATE', to_jsonb(old), to_jsonb(new));
        return new;
    elsif (TG_OP = 'DELETE') then
        insert into public.inventory_logs (item_id, user_id, action, old_data)
        values (old.id, old.user_id, 'DELETE', to_jsonb(old));
        return old;
    end if;
    return null;
end;
$$;

create trigger trg_log_item_changes
after insert or update or delete on public.items
for each row execute function public.log_item_changes();
