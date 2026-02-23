-- Optimize vector search with HNSW index
-- This provides faster semantic search results compared to ivfflat or no index.
-- Note: 'lists' is for ivfflat, HNSW uses m and ef_construction.

CREATE INDEX IF NOT EXISTS idx_items_embedding_hnsw 
ON items 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Re-analyze to update statistics
ANALYZE items;
