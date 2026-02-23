-- 0010_container_capacity.sql
-- Add capacity tracking to containers

alter table public.containers 
add column if not exists max_items int null default 50;

comment on column public.containers.max_items is 'Límite sugerido de items para este contenedor.';
