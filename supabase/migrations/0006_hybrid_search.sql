-- 0006_hybrid_search.sql
-- RPC de búsqueda HÍBRIDA: combina texto full-text + similitud semántica (pgvector).
-- Permite buscar "algo para conectar la tele" y encontrar HDMI/adaptadores.
--
-- Parámetros:
--   search_query  → texto libre del usuario
--   query_embedding → vector generado por generate-embedding
--   match_threshold → mínimo de similitud semántica (ej: 0.3)
--   match_count     → máx resultados

CREATE OR REPLACE FUNCTION public.hybrid_search(
    search_query     text,
    query_embedding  vector(768),
    match_threshold  float DEFAULT 0.3,
    match_count      int   DEFAULT 20
)
RETURNS TABLE (
    id           uuid,
    name         text,
    category     text,
    description  text,
    photo_path   text,
    container_id uuid,
    item_type    item_type_enum,
    condition    item_condition_enum,
    quantity     int,
    tags         text[],
    score_text   float,
    score_semantic float,
    score_combined float
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH

    -- 1. Text search (tsvector + GIN index)
    text_matches AS (
        SELECT
            i.id,
            ts_rank_cd(i.search_tsv, websearch_to_tsquery('spanish', search_query))::float AS rank
        FROM public.items i
        WHERE
            i.user_id = auth.uid()
            AND i.search_tsv @@ websearch_to_tsquery('spanish', search_query)
    ),

    -- 2. Semantic search (pgvector cosine distance)
    semantic_matches AS (
        SELECT
            i.id,
            (1 - (i.embedding <=> query_embedding))::float AS similarity
        FROM public.items i
        WHERE
            i.user_id = auth.uid()
            AND i.embedding IS NOT NULL
            AND 1 - (i.embedding <=> query_embedding) > match_threshold
    ),

    -- 3. Union and score combining
    combined AS (
        SELECT
            COALESCE(t.id, s.id) AS id,
            COALESCE(t.rank, 0.0) AS score_text,
            COALESCE(s.similarity, 0.0) AS score_semantic,
            -- Weighted: 40% text + 60% semantic
            (0.4 * COALESCE(t.rank, 0.0) + 0.6 * COALESCE(s.similarity, 0.0)) AS score_combined
        FROM text_matches t
        FULL OUTER JOIN semantic_matches s ON t.id = s.id
    )

    SELECT
        i.id,
        i.name,
        i.category,
        i.description,
        i.photo_path,
        i.container_id,
        i.item_type,
        i.condition,
        i.quantity,
        i.tags,
        c.score_text,
        c.score_semantic,
        c.score_combined
    FROM combined c
    JOIN public.items i ON i.id = c.id
    ORDER BY c.score_combined DESC
    LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION public.hybrid_search IS
'Búsqueda híbrida: combina full-text (tsvector) + semántica (pgvector).
Score = 0.4 * text_rank + 0.6 * semantic_similarity.
Requiere: search_tsv actualizado y embedding generado por embed-text.';
