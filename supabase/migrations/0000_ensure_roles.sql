-- Ensure Supabase Roles for Local Dev
DO $$
BEGIN
    -- anon
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN NOINHERIT;
    END IF;
    -- authenticated
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN NOINHERIT;
    END IF;
    -- service_role 
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN NOINHERIT;
    END IF;
    -- supabase_auth_admin
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_auth_admin') THEN
        CREATE ROLE supabase_auth_admin WITH LOGIN PASSWORD 'password';
    END IF;
    -- supabase_storage_admin
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_storage_admin') THEN
        CREATE ROLE supabase_storage_admin WITH LOGIN PASSWORD 'password';
    END IF;
    -- authenticator
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticator') THEN
        CREATE ROLE authenticator WITH LOGIN PASSWORD 'password' NOINHERIT;
    END IF;
END
$$;

GRANT anon, authenticated, service_role TO authenticator;

ALTER ROLE supabase_auth_admin WITH LOGIN PASSWORD 'password';
ALTER ROLE supabase_storage_admin WITH LOGIN PASSWORD 'password';
ALTER ROLE authenticator WITH LOGIN PASSWORD 'password';

GRANT ALL PRIVILEGES ON DATABASE postgres TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON DATABASE postgres TO supabase_storage_admin;
GRANT ALL PRIVILEGES ON DATABASE postgres TO authenticator;
-- Ensure schemas exist if not handled by extensions
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS _realtime;
ALTER SCHEMA storage OWNER TO supabase_storage_admin;
ALTER SCHEMA _realtime OWNER TO supabase_admin; -- if supabase_admin exists or use postgres
