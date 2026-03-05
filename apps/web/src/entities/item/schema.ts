/**
 * entities/item/schema.ts
 * Zod schemas + tipos TypeScript para Item.
 */
import { z } from 'zod';

export const ItemTypeSchema = z.enum(['device', 'accessory', 'other']);
export const ItemConditionSchema = z.enum(['new', 'used', 'defective']);

export const ItemSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    container_id: z.string().uuid(),
    name: z.string().min(1).max(100),
    category: z.string().nullable().optional(),
    description: z.string().max(1000).nullable().optional(),
    photo_path: z.string().nullable().optional(),
    photo_mime: z.string().nullable().optional(),
    quantity: z.number().int().min(1),
    condition: ItemConditionSchema,
    item_type: ItemTypeSchema,
    belongs_to_item_id: z.string().uuid().nullable().optional(),
    tags: z.array(z.string()).default([]),
    embedding: z.array(z.number()).nullable().optional(),
    created_at: z.string().datetime({ offset: true }).optional(),
    updated_at: z.string().datetime({ offset: true }).optional(),
});

export type Item = z.infer<typeof ItemSchema>;
export type ItemType = z.infer<typeof ItemTypeSchema>;
export type ItemCondition = z.infer<typeof ItemConditionSchema>;

export const CreateItemSchema = z.object({
    container_id: z.string().uuid('Selecciona un contenedor'),
    name: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
    category: z.string().nullable().optional(),
    description: z.string().max(1000, 'Máximo 1000 caracteres').nullable().optional(),
    tags: z.array(z.string()).default([]),
    quantity: z.number().int().min(1).default(1),
    condition: ItemConditionSchema.default('used'),
    item_type: ItemTypeSchema.default('other'),
    belongs_to_item_id: z.string().uuid().nullable().optional(),
    photo_path: z.string().nullable().optional(),
    photo_mime: z.string().nullable().optional(),
});

export type CreateItemInput = z.infer<typeof CreateItemSchema>;
