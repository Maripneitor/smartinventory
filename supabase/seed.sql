-- seed.sql — Datos de ejemplo para desarrollo/testing
-- NO ejecutar en producción
-- Uso: Supabase CLI: supabase db seed o manual.

begin;

-- Categorías comunes para tests (no hay tabla de categorías,
-- se almacenan como text en items.category — esto es solo referencia).
--
-- Para testear con datos reales, usa la UI o el script de Postman / HTTP.

-- Puedes insertar un location y container de prueba
-- SOLO si tienes un user_id real de auth.users:
--
-- insert into public.locations (user_id, name, description)
-- values ('00000000-0000-0000-0000-000000000001', 'Oficina', 'Mi oficina en casa');
--
-- insert into public.containers (id, user_id, location_id, label, qr_payload)
-- values (
--   gen_random_uuid(),
--   '00000000-0000-0000-0000-000000000001',
--   (select id from public.locations limit 1),
--   'Caja de cables',
--   'http://localhost:3000/c/test'
-- );

commit;
