import { createClient } from '@/lib/supabase/browser';

export interface Location {
    id: string;
    name: string;
    description?: string;
    parent_id?: string;
    user_id: string;
    created_at: string;
}

export const locationsService = {
    async getAll() {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('locations')
            .select('*')
            .order('name');

        if (error) throw error;
        return data as Location[];
    },

    async create(payload: Partial<Location>) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        let userId = user?.id;

        if (!userId && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true') {
            userId = '4cef6da7-62a7-4855-80a6-27583e387a05'; // mariomoguel05@gmail.com
        }

        if (!userId) throw new Error('Not authenticated — redirecting to login');

        const { data, error } = await supabase
            .from('locations')
            .insert({
                ...payload,
                user_id: userId
            })
            .select()
            .single();

        if (error) throw error;
        return data as Location;
    },

    // Helper para construir el árbol en el cliente
    buildTree(locations: Location[]) {
        const map = new Map();
        locations.forEach(loc => map.set(loc.id, { ...loc, children: [] }));

        const tree: any[] = [];
        locations.forEach(loc => {
            if (loc.parent_id && map.has(loc.parent_id)) {
                map.get(loc.parent_id).children.push(map.get(loc.id));
            } else {
                tree.push(map.get(loc.id));
            }
        });
        return tree;
    }
};

// Alias para mantener compatibilidad con el código sugerido
export const listLocations = locationsService.getAll;
