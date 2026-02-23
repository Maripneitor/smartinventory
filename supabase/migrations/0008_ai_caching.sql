-- Add ai_metadata column to items for caching analysis results
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'ai_metadata') THEN
        ALTER TABLE items ADD COLUMN ai_metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Create an index for faster lookups in JSONB if needed later
CREATE INDEX IF NOT EXISTS idx_items_ai_metadata ON items USING GIN (ai_metadata);
