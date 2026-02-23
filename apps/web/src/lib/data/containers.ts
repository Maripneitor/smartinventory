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
        let userId = user?.id;

        if (!userId && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true') {
            userId = '4cef6da7-62a7-4855-80a6-27583e387a05'; // mariomoguel05@gmail.com
        }

        if (!userId) throw new Error('Not authenticated — redirecting to login');

        const { data, error } = await supabase
            .from("containers")
            .insert({
                id: params.id,
                label: params.label,
                location_id: params.location_id,
                qr_payload: params.qr_payload,
                user_id: userId
            })
            .select("*")
            .single();

        if (error) throw error;
        return data;
    }
};
