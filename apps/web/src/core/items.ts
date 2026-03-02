import { createClient, getDevUser } from "@/lib/supabase/browser";
export type { Item, ItemType, ItemCondition, CreateItemInput } from "@/entities/item/schema";
import type { Item, ItemType, ItemCondition, CreateItemInput } from "@/entities/item/schema";
import { db } from "./db";

export const itemsService = {
    async getAll() {
        const supabase = createClient();
        try {
            const { data, error } = await supabase
                .from("items")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            if (data) {
                await db.items.bulkPut(data as Item[]);
            }
            return data as Item[];
        } catch (e) {
            console.warn("Offline: returning all items from local DB", e);
            return await db.items.toArray();
        }
    },
    async getByContainer(containerId: string) {
        const supabase = createClient();
        try {
            const { data, error } = await supabase
                .from("items")
                .select("*")
                .eq("container_id", containerId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            if (data) {
                await db.items.bulkPut(data as Item[]);
            }
            return data as Item[];
        } catch (e) {
            console.warn("Offline: returning items for container from local DB", containerId);
            return await db.items.where("container_id").equals(containerId).toArray();
        }
    },

    async create(
        params: CreateItemInput & {
            id?: string;
            photo_path?: string | null;
            photo_mime?: string | null;
            ai_metadata?: any | null;
            file?: File; // optional blob for offline storage
        }
    ) {
        const supabase = createClient();
        const user = await getDevUser();
        const userId = user?.id;

        if (!userId) throw new Error("Not authenticated");

        const itemId = params.id || crypto.randomUUID();
        const itemData: Item = {
            id: itemId,
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
            ai_metadata: params.ai_metadata ?? {},
            user_id: userId,
            created_at: new Date().toISOString()
        };

        // Always save locally first
        await db.items.put(itemData);

        // If we have a file and it hasn't been uploaded yet (photo_path is null or similar)
        if (params.file && !params.photo_path) {
            await db.images.put({
                id: itemId,
                blob: params.file,
                mime: params.file.type
            });
        }

        try {
            const { data, error } = await supabase
                .from("items")
                .insert({
                    ...itemData,
                    created_at: undefined // let DB handle or keep the one we generated
                })
                .select("*")
                .single();

            if (error) throw error;
            return data as Item;
        } catch (e) {
            console.warn("Offline: Queuing item creation", e);
            await db.sync_queue.add({
                action: "create",
                type: "item",
                data: itemData,
                timestamp: Date.now()
            });
            return itemData;
        }
    },

    async getDevices() {
        const supabase = createClient();
        try {
            const { data, error } = await supabase
                .from("items")
                .select("id, name, photo_path")
                .eq("item_type", "device")
                .order("name");

            if (error) throw error;
            return data;
        } catch (e) {
            return await db.items.where("item_type").equals("device").toArray();
        }
    },

    async getSuggestionByCategory(category: string) {
        const supabase = createClient();
        try {
            const { data, error } = await supabase
                .from("items")
                .select("container_id, containers(label)")
                .eq("category", category)
                .limit(1);

            if (error) throw error;
            return data?.[0] as { container_id: string; containers: { label: string } } | undefined;
        } catch (e) {
            // Very basic offline suggestion
            const local = await db.items.where("category").equals(category).first();
            if (local) {
                const container = await db.containers.get(local.container_id);
                return {
                    container_id: local.container_id,
                    containers: { label: container?.label || 'Caja existente' }
                };
            }
            return undefined;
        }
    },

    async getActivityLogs() {
        const supabase = createClient();
        try {
            const { data, error } = await supabase
                .from("inventory_logs")
                .select("*, items(name)")
                .order("created_at", { ascending: false })
                .limit(20);

            if (error) throw error;
            return data;
        } catch (e) {
            return []; // Logs are harder to cache locally, could store them if needed
        }
    },

    async exportToCSV() {
        const data = await this.getAll();

        const headers = ["Nombre", "Categoría", "Cantidad", "Estado", "Tipo", "Etiquetas"];
        const rows = (data || []).map((item: any) => [
            item.name,
            item.category || "",
            item.quantity,
            item.condition,
            item.item_type,
            (item.tags || []).join("; ")
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((row: any[]) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `inventario_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
