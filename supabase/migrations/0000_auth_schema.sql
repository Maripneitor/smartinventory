-- 0000_auth_schema.sql
-- Crea el esquema minimo de Auth para que las migraciones de Supabase 
-- funcionen en un Postgres local fuera de Supabase Cloud.

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Crear el usuario mock por defecto para el bypass de login
INSERT INTO auth.users (id, email)
VALUES ('00000000-0000-0000-0000-000000000000', 'mario@smartinventory.local')
ON CONFLICT (id) DO NOTHING;

-- Mock de la funcion auth.uid() que usa Supabase
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS UUID AS $$
    SELECT '00000000-0000-0000-0000-000000000000'::UUID;
$$ LANGUAGE SQL STABLE;
