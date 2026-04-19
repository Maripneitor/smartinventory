-- Modificación de la tabla containers
ALTER TABLE containers 
ADD COLUMN type text DEFAULT 'caja_carton',
ADD COLUMN max_capacity integer DEFAULT 20;

-- Modificación de la tabla items
ALTER TABLE items 
ALTER COLUMN container_id DROP NOT NULL,
ADD COLUMN location_id uuid REFERENCES locations(id);

-- Actualizar items existentes para que tengan el location_id de su contenedor (si aplica)
UPDATE items i
SET location_id = c.location_id
FROM containers c
WHERE i.container_id = c.id
AND i.location_id IS NULL;
