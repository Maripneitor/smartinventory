-- Actualización de Esquema para SmartInventory: Roles Familiares y Especificaciones Dinámicas

-- 1. Crear tipos de roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tabla de Grupos Familiares (Workspaces)
CREATE TABLE IF NOT EXISTS public.family_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    owner_id UUID REFERENCES auth.users(id)
);

-- 3. Tabla de Miembros del Grupo (Pivote)
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.family_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'viewer',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(group_id, user_id)
);

-- 4. Expansión de la tabla Items
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS related_items UUID[] DEFAULT '{}';
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS family_group_id UUID REFERENCES public.family_groups(id);

-- 5. Expansión de la tabla Containers
ALTER TABLE public.containers ADD COLUMN IF NOT EXISTS family_group_id UUID REFERENCES public.family_groups(id);

-- 6. Políticas RLS (Row Level Security) Evolucionadas
-- Habilitar RLS en nuevas tablas
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Políticas para Family Groups
CREATE POLICY "Users can see groups they belong to" ON public.family_groups
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.group_members WHERE group_id = public.family_groups.id AND user_id = auth.uid())
        OR owner_id = auth.uid()
    );

-- Políticas para Items (Basadas en Grupo)
DROP POLICY IF EXISTS "Items visibility policy" ON public.items;
CREATE POLICY "Items group visibility" ON public.items
    FOR SELECT USING (
        family_group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
        OR user_id = auth.uid() -- Retrocompatibilidad
    );

CREATE POLICY "Items group insert" ON public.items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.group_members 
            WHERE group_id = family_group_id 
            AND user_id = auth.uid() 
            AND role IN ('admin', 'editor')
        )
    );

-- 7. Funciones auxiliares para verificar roles
CREATE OR REPLACE FUNCTION public.get_user_role(target_group_id UUID)
RETURNS user_role AS $$
    SELECT role FROM public.group_members 
    WHERE group_id = target_group_id AND user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;
