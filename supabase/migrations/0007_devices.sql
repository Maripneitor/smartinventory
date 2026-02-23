-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can manage their own devices"
    ON devices
    FOR ALL
    USING (auth.uid() = user_id);

-- Add device relationship to items
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'belongs_to_device_id') THEN
        ALTER TABLE items ADD COLUMN belongs_to_device_id UUID REFERENCES devices(id) ON DELETE SET NULL;
    END IF;
END $$;
