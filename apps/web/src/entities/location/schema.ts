/**
 * entities/location/schema.ts
 * Zod schemas + tipos TypeScript para Location.
 *
 * Usamos BaseLocationSchema para validar respuestas del servidor (flat).
 * LocationTree es la representación con children (construida en el cliente).
 */
import { z } from 'zod';

// Schema para lo que viene del servidor (sin children)
export const LocationSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    name: z.string().min(1),
    description: z.string().nullable().optional(),
    parent_id: z.string().uuid().nullable().optional(),
    created_at: z.string().datetime({ offset: true }).optional(),
});

export type Location = z.infer<typeof LocationSchema>;

// Tipo árbol (con children) — construido en el cliente con locationsService.buildTree()
export interface LocationTree extends Location {
    children: LocationTree[];
}

export const CreateLocationSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    description: z.string().nullable().optional(),
    parent_id: z.string().uuid().nullable().optional(),
});

export type CreateLocationInput = z.infer<typeof CreateLocationSchema>;
