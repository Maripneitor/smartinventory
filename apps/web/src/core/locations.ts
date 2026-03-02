import { createClient, getDevUser } from '@/lib/supabase/browser';
import { db } from './db';

export interface Location {
    id: string;
    name: string;
    description?: string;
    parent_id?: string;
    user_id: string;
    created_at: string;
}

export interface LocationTreeNode extends Location {
    children: LocationTreeNode[];
}

export const locationsService = {
    async getAll() {
        const supabase = createClient();
        try {
            const { data, error } = await supabase
                .from('locations')
                .select('*')
                .order('name');

            if (error) throw error;
            if (data) {
                await db.locations.bulkPut(data);
            }
            return data as Location[];
        } catch (e) {
            console.warn("Offline: returning locations from local DB", e);
            return await db.locations.toArray() as Location[];
        }
    },

    async create(payload: Partial<Location>) {
        const supabase = createClient();
        const user = await getDevUser();
        let userId = user?.id;

        if (!userId && (process as any).env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true') {
            userId = '4cef6da7-62a7-4855-80a6-27583e387a05';
        }

        if (!userId) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('locations')
            .insert({
                ...payload,
                user_id: userId
            })
            .select()
            .single();

        if (error) throw error;
        if (data) await db.locations.put(data);
        return data as Location;
    },

    // Helper para construir el árbol en el cliente
    buildTree(locations: Location[]): LocationTreeNode[] {
        const map = new Map<string, LocationTreeNode>();
        locations.forEach(loc => map.set(loc.id, { ...loc, children: [] }));

        const tree: LocationTreeNode[] = [];
        locations.forEach(loc => {
            if (loc.parent_id && map.has(loc.parent_id)) {
                map.get(loc.parent_id)!.children.push(map.get(loc.id)!);
            } else {
                tree.push(map.get(loc.id)!);
            }
        });
        return tree;
    }
};

// Alias para mantener compatibilidad con el código sugerido
export const listLocations = locationsService.getAll;

