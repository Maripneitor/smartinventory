-- supabase/migrations/0010_products_vector_search.sql

-- Habilitar extensión pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  category TEXT,
  description TEXT,
  image_url TEXT,
  price DECIMAL(10,2),
  source TEXT,
  attributes JSONB DEFAULT '{}',
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice HNSW para búsqueda vectorial rápida
CREATE INDEX IF NOT EXISTS products_embedding_idx ON products 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Función de búsqueda vectorial
CREATE OR REPLACE FUNCTION match_products(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  brand TEXT,
  model TEXT,
  category TEXT,
  description TEXT,
  image_url TEXT,
  price DECIMAL,
  source TEXT,
  attributes JSONB,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.brand,
    p.model,
    p.category,
    p.description,
    p.image_url,
    p.price,
    p.source,
    p.attributes,
    1 - (p.embedding <=> query_embedding) as similarity
  FROM products p
  WHERE 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Función para encontrar productos similares
CREATE OR REPLACE FUNCTION find_similar_products(
  product_id UUID,
  match_count int
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  brand TEXT,
  category TEXT,
  description TEXT,
  image_url TEXT,
  price DECIMAL,
  similarity float
)
LANGUAGE plpgsql
AS $$
DECLARE
  source_embedding vector(1536);
BEGIN
  -- Obtener el embedding del producto origen
  SELECT embedding INTO source_embedding
  FROM products
  WHERE id = product_id;
  
  -- Buscar productos similares
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.brand,
    p.category,
    p.description,
    p.image_url,
    p.price,
    1 - (p.embedding <=> source_embedding) as similarity
  FROM products p
  WHERE p.id != product_id
    AND 1 - (p.embedding <=> source_embedding) > 0.5
  ORDER BY p.embedding <=> source_embedding
  LIMIT match_count;
END;
$$;
