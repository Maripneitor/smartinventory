-- Migración: Sistema de Préstamos y Listas de Recolección (Pick Lists)
-- Fecha: Abril 2026

-- 1. Añadir campo borrowed_by a la tabla items
ALTER TABLE items ADD COLUMN IF NOT EXISTS borrowed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Crear tabla de listas de recolección (Pick Lists)
CREATE TABLE IF NOT EXISTS pick_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'completed')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Crear tabla de items en la lista de recolección
CREATE TABLE IF NOT EXISTS pick_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES pick_lists(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('requested', 'picked', 'returned')) DEFAULT 'requested',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(list_id, item_id)
);

-- 4. Habilitar RLS
ALTER TABLE pick_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE pick_list_items ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Seguridad (RLS)

-- pick_lists: Solo el dueño puede ver/editar sus listas
CREATE POLICY "Users can manage their own pick lists"
    ON pick_lists
    FOR ALL
    USING (auth.uid() = user_id);

-- pick_list_items: Solo si eres el dueño de la lista asociada
CREATE POLICY "Users can manage items in their own pick lists"
    ON pick_list_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM pick_lists
            WHERE id = pick_list_items.list_id
            AND user_id = auth.uid()
        )
    );

-- 6. Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pick_lists_updated_at
    BEFORE UPDATE ON pick_lists
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_pick_list_items_updated_at
    BEFORE UPDATE ON pick_list_items
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
