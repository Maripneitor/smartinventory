-- Actualización para SmartInventory: Roles, Privacidad e IDs Normativos

-- 1. Asegurar que existe una tabla de perfiles para manejar roles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    role TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- 2. Actualizar tabla de contenedores para privacidad
ALTER TABLE public.containers 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- Actualizar RLS para contenedores
-- Eliminar políticas antiguas si es necesario (asumiendo nombres estándar)
DROP POLICY IF EXISTS "Containers are viewable by everyone" ON public.containers;

-- Nueva política: Contenedores públicos son visibles para todos, privados solo para el dueño
CREATE POLICY "Containers visibility policy" ON public.containers
    FOR SELECT USING (
        is_private = false OR auth.uid() = owner_id
    );

CREATE POLICY "Owners can manage their containers" ON public.containers
    FOR ALL USING (auth.uid() = owner_id);

-- 3. Actualizar tabla de items para IDs Normativos
ALTER TABLE public.items 
ADD COLUMN IF NOT EXISTS serial_number TEXT UNIQUE;

-- Actualizar RLS para items (basado en la privacidad del contenedor)
DROP POLICY IF EXISTS "Items are viewable by everyone" ON public.items;

CREATE POLICY "Items visibility policy" ON public.items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.containers c 
            WHERE c.id = items.container_id 
            AND (c.is_private = false OR auth.uid() = c.owner_id)
        )
    );

-- 4. Trigger para crear perfil automáticamente al registrarse (Opcional pero recomendado)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (new.id, new.email, 'owner'); -- Por defecto el primer usuario suele ser owner o según lógica de negocio
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
