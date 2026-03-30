-- Migración: Añadir soporte para Accesorios y Especificaciones Técnicas
-- Generado: 2026-03-30
-- Descripción: Agrega las columnas accessories (JSONB), technical_specs y condition
--              a la tabla items para soportar la nueva funcionalidad de detección de accesorios.

-- ── 1. Añadir columnas a la tabla items ──────────────────────────────────────

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS accessories    JSONB    DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS technical_specs TEXT,
  ADD COLUMN IF NOT EXISTS condition      TEXT;

-- ── 2. Comentarios de documentación ──────────────────────────────────────────

COMMENT ON COLUMN public.items.accessories IS
  'Array JSON de accesorios detectados por la IA. Estructura: [{name, isIncluded, details?}]';

COMMENT ON COLUMN public.items.technical_specs IS
  'Especificaciones técnicas visibles en la imagen (ej. "WiFi 6 Dual Band, 12V 2A")';

COMMENT ON COLUMN public.items.condition IS
  'Estado aparente del objeto según la IA (ej. "Buen estado", "Desgastado", "Requiere revisión")';

-- ── 3. Índice GIN para búsqueda eficiente dentro del JSONB de accesorios ─────

CREATE INDEX IF NOT EXISTS items_accessories_gin_idx
  ON public.items USING GIN (accessories);

-- ── 4. Validar que la columna accessories siempre sea un array ────────────────

ALTER TABLE public.items
  ADD CONSTRAINT accessories_is_array
  CHECK (jsonb_typeof(accessories) = 'array');
