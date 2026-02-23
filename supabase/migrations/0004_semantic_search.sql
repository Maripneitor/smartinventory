-- 0003_semantic_search.sql
-- Añade la función de búsqueda por similitud de coseno para items.

begin;

create or replace function public.match_items (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  name text,
  category text,
  description text,
  photo_path text,
  container_id uuid,
  item_type item_type_enum,
  condition item_condition_enum,
  quantity int,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    items.id,
    items.name,
    items.category,
    items.description,
    items.photo_path,
    items.container_id,
    items.item_type,
    items.condition,
    items.quantity,
    1 - (items.embedding <=> query_embedding) as similarity
  from items
  where items.user_id = auth.uid()
    and items.embedding is not null
    and 1 - (items.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;

commit;
