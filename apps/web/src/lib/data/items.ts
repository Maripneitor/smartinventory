import { createClient } from '@/lib/supabase/browser';

export type ItemType = "device" | "accessory" | "other";
export type ItemCondition = "new" | "used" | "defective";

export interface Item {
    id: string;
    container_id: string;
    name: string;
    category?: string;
    description?: string;
    photo_path?: string;
    quantity: number;
    condition: ItemCondition;
    item_type: ItemType;
    belongs_to_item_id?: string;
    tags: string[];
}

export const itemsService = {
    async getAll() {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Item[];
    },
    async getByContainer(containerId: string) {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('container_id', containerId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Item[];
    },

    async create(params: {
        id?: string;
        container_id: string;
        name: string;
        category?: string | null;
        description?: string | null;
        tags?: string[];
        quantity: number;
        condition: ItemCondition;
        item_type: ItemType;
        belongs_to_item_id?: string | null;
        photo_path?: string | null;
        photo_mime?: string | null;
    }) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || '00000000-0000-0000-0000-000000000000';

        const { data, error } = await supabase
            .from("items")
            .insert({
                id: params.id,
                user_id: userId,
                container_id: params.container_id,
                name: params.name,
                category: params.category ?? null,
                description: params.description ?? null,
                tags: params.tags ?? [],
                quantity: params.quantity,
                condition: params.condition,
                item_type: params.item_type,
                belongs_to_item_id: params.belongs_to_item_id ?? null,
                photo_path: params.photo_path ?? null,
                photo_mime: params.photo_mime ?? null,
            })
            .select("*")
            .single();

        if (error) throw error;
        return data as Item;
    },

    async getDevices() {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('items')
            .select('id, name, photo_path')
            .eq('item_type', 'device')
            .order('name');

        if (error) throw error;
        return data;
    }
};
