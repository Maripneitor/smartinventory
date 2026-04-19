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
        type?: string;
        max_capacity?: number;
        is_private?: boolean;
        family_group_id?: string;
    }) {
        const supabase = createClient();
        const user = await getDevUser();
        let userId = user?.id;

        if (!userId && (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true')) {
            userId = '4cef6da7-62a7-4855-80a6-27583e387a05';
        }

        if (!userId) throw new Error('Not authenticated');

        const containerData: Container = {
            id: params.id,
            label: params.label,
            location_id: params.location_id,
            qr_payload: params.qr_payload,
            user_id: userId,
            owner_id: userId,
            type: params.type || 'caja_carton',
            max_capacity: params.max_capacity ?? 20,
            is_private: params.is_private ?? false,
            family_group_id: params.family_group_id ?? null,
            created_at: new Date().toISOString()
        };

        // Always save locally first for instant UI response
        await db.containers.put(containerData);

        try {
            const { data, error } = await supabase
                .from("containers")
                .insert(containerData)
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
            const [containersRes, itemsRes, looseItemsRes] = await Promise.all([
                supabase.from('containers').select('*', { count: 'exact', head: true }),
                supabase.from('items').select('*', { count: 'exact', head: true }),
                supabase.from('items').select('*', { count: 'exact', head: true }).is('container_id', null)
            ]);

            return {
                totalContainers: containersRes.count || 0,
                totalItems: itemsRes.count || 0,
                looseItems: looseItemsRes.count || 0
            };
        } catch (e) {
            const [cCount, iCount, lCount] = await Promise.all([
                db.containers.count(),
                db.items.count(),
                db.items.where('container_id').equals('').count() // Dexie null check workaround or similar
            ]);
            
            // For Dexie, we might need a better way if null is stored as null
            const looseCount = await db.items.filter(item => !item.container_id).count();

            return {
                totalContainers: cCount,
                totalItems: iCount,
                looseItems: looseCount
            };
        }
    },
    async update(id: string, params: Partial<Container>) {
        const supabase = createClient();
        
        // Local update
        await db.containers.update(id, params);
        
        try {
            const { data, error } = await supabase
                .from("containers")
                .update(params)
                .eq("id", id)
                .select("*")
                .single();
                
            if (error) throw error;
            return data as Container;
        } catch (e) {
            console.warn("Offline: Queuing container update", e);
            await db.sync_queue.add({
                action: "update",
                type: "container",
                data: { id, ...params },
                timestamp: Date.now()
            });
            return (await db.containers.get(id)) as Container;
        }
    },
    async getByLocation(locationId: string) {
        const supabase = createClient();
        try {
            const { data, error } = await supabase
                .from('containers')
                .select('*')
                .eq('location_id', locationId)
                .order('label');

            if (error) throw error;
            return data as Container[];
        } catch (e) {
            return await db.containers.where('location_id').equals(locationId).toArray();
        }
    }
};


