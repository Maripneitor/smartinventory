import { createClient, getDevUser } from '@/lib/supabase/browser';
import { type Container } from '@/entities/container/schema';
import { db } from './db';

export const containersService = {
    async getAll() {
        const supabase = createClient();
        try {
            const { data, error } = await supabase
                .from('containers')
                .select('*, locations(name)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Sync with local DB
            if (data) {
                await db.containers.bulkPut(data as Container[]);
            }
            return data;
        } catch (e) {
            console.warn("Offline: returning containers from local DB", e);
            return await db.containers.toArray();
        }
    },

    async getById(id: string) {
        const supabase = createClient();
        try {
            const { data, error } = await supabase
                .from('containers')
                .select('*, locations(*)')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) await db.containers.put(data as Container);
            return data;
        } catch (e) {
            console.warn("Offline: returning container from local DB", id);
            return await db.containers.get(id);
        }
    },

    async create(params: {
        id: string;
        label: string;
        location_id: string;
        qr_payload: string;
        max_items?: number;
    }) {
        const supabase = createClient();
        const user = await getDevUser();
        let userId = user?.id;

        if (!userId && (process as any).env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true') {
            userId = '4cef6da7-62a7-4855-80a6-27583e387a05';
        }

        if (!userId) throw new Error('Not authenticated');

        const containerData: Container = {
            id: params.id,
            label: params.label,
            location_id: params.location_id,
            qr_payload: params.qr_payload,
            user_id: userId,
            created_at: new Date().toISOString()
        };

        // Always save locally first for instant UI response
        await db.containers.put(containerData);

        try {
            const { data, error } = await supabase
                .from("containers")
                .insert({
                    ...containerData,
                    max_items: params.max_items ?? 50
                })
                .select("*")
                .single();

            if (error) throw error;
            return data;
        } catch (e) {
            console.warn("Offline: Queuing container creation", e);
            await db.sync_queue.add({
                action: "create",
                type: "container",
                data: containerData,
                timestamp: Date.now()
            });
            return containerData;
        }
    },

    async getStats() {
        const supabase = createClient();
        try {
            const [containersRes, itemsRes] = await Promise.all([
                supabase.from('containers').select('*', { count: 'exact', head: true }),
                supabase.from('items').select('*', { count: 'exact', head: true })
            ]);

            return {
                totalContainers: containersRes.count || 0,
                totalItems: itemsRes.count || 0,
            };
        } catch (e) {
            const [cCount, iCount] = await Promise.all([
                db.containers.count(),
                db.items.count()
            ]);
            return {
                totalContainers: cCount,
                totalItems: iCount
            };
        }
    }
};


