-- Migración para soportar el nuevo flujo de búsqueda del Staff Engineer
DROP FUNCTION IF EXISTS public.search_inventory(text);
CREATE OR REPLACE FUNCTION public.search_inventory(
    search_term text
)
RETURNS TABLE (
    id           uuid,
    container_id uuid,
    name         text,
    category     text,
    confidence   float,
    description  text,
    tags         text[],
    created_at   timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.container_id,
        i.name,
        i.category,
        COALESCE((i.ai_metadata->>'confidence')::float, 1.0) as confidence,
        i.description,
        i.tags,
        i.created_at
    FROM public.items i
    WHERE 
        (i.name ILIKE '%' || search_term || '%' OR 
         i.description ILIKE '%' || search_term || '%' OR
         i.category ILIKE '%' || search_term || '%' OR
         search_term = ANY(i.tags))
    ORDER BY i.created_at DESC
    LIMIT 20;
END;
$$;
