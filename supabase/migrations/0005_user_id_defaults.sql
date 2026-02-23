-- 0005_user_id_defaults.sql
-- Trigger para que la DB asigne user_id = auth.uid() automáticamente.
-- El cliente NUNCA necesita enviar user_id; esto elimina los fallbacks fake.

-- Función genérica de trigger
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id := auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar a containers
DROP TRIGGER IF EXISTS containers_set_user_id ON containers;
CREATE TRIGGER containers_set_user_id
    BEFORE INSERT ON containers
    FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- Aplicar a items
DROP TRIGGER IF EXISTS items_set_user_id ON items;
CREATE TRIGGER items_set_user_id
    BEFORE INSERT ON items
    FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- Aplicar a locations
DROP TRIGGER IF EXISTS locations_set_user_id ON locations;
CREATE TRIGGER locations_set_user_id
    BEFORE INSERT ON locations
    FOR EACH ROW EXECUTE FUNCTION set_user_id();
