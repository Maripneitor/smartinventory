-- 1. Creamos la tabla de Items con la estructura que definimos en TypeScript
CREATE TABLE IF NOT EXISTS public.items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    container_id UUID NOT NULL, 
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    confidence NUMERIC NOT NULL,
    description TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Función RPC para la búsqueda rápida (El Backend Proxy para useSearchController)
-- Esta función busca coincidencias en el nombre, categoría o descripción.
CREATE OR REPLACE FUNCTION search_inventory(search_term TEXT)
RETURNS SETOF public.items AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.items
    WHERE 
        -- Búsqueda insensible a mayúsculas/minúsculas usando ILIKE
        name ILIKE '%' || search_term || '%' OR
        category ILIKE '%' || search_term || '%' OR
        description ILIKE '%' || search_term || '%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
