-- 0003_rpc_search.sql (opcional)
create or replace function public.match_items_semantic(
  query_embedding vector(768),
  match_count int default 20
)
returns table (
  id uuid,
  container_id uuid,
  name text,
  category text,
  description text,
  photo_path text,
  similarity float
)
language sql
stable
as $$
  select
    i.id,
    i.container_id,
    i.name,
    i.category,
    i.description,
    i.photo_path,
    (1 - (i.embedding <=> query_embedding))::float as similarity
  from public.items i
  where i.user_id = auth.uid()
    and i.embedding is not null
  order by i.embedding <=> query_embedding
  limit match_count;
$$;