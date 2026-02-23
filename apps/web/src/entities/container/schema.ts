/**
 * entities/container/schema.ts
 * Zod schemas + tipos TypeScript para Container.
 * Valida respuestas del servidor para evitar runtime crashes por datos inesperados.
 */
import { z } from 'zod';

export const ContainerSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    location_id: z.string().uuid().nullable().optional(),
    label: z.string().min(1),
    qr_payload: z.string().min(1),
    created_at: z.string().datetime({ offset: true }).optional(),
    // Relación join (opcional, cuando se hace select con locations)
    locations: z.object({
        id: z.string().uuid().optional(),
        name: z.string().optional(),
    }).nullable().optional(),
});

export type Container = z.infer<typeof ContainerSchema>;

export const CreateContainerSchema = z.object({
    id: z.string().uuid(),
    label: z.string().min(1, 'El nombre es requerido'),
    location_id: z.string().uuid('Selecciona una ubicación'),
    qr_payload: z.string().min(1),
});

export type CreateContainerInput = z.infer<typeof CreateContainerSchema>;
