import { createClient } from '@/lib/supabase/browser';

export interface Container {
    id: string;
    user_id: string;
    location_id: string;
    label: string;
    qr_payload: string;
    created_at: string;
}

export const containersService = {
    async getAll() {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('containers')
            .select('*, locations(name)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getById(id: string) {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('containers')
            .select('*, locations(*)')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async create(params: {
        id: string;
        label: string;
        location_id: string;
        qr_payload: string;
    }) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || '00000000-0000-0000-0000-000000000000';

        const { data, error } = await supabase
            .from("containers")
            .insert({
                id: params.id,
                user_id: userId,
                label: params.label,
                location_id: params.location_id,
                qr_payload: params.qr_payload,
            })
            .select("*")
            .single();

        if (error) throw error;
        return data;
    }
};
