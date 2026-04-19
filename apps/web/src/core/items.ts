import { createClient, getDevUser } from "@/lib/supabase/browser";
import { db } from "@/core/db";
export type { Item, ItemType, ItemCondition, CreateItemInput } from "@/entities/item/schema";
import type { Item, ItemType, ItemCondition, CreateItemInput } from "@/entities/item/schema";
import { generateSerialNumber, getCategoryCode } from "./utils/nomenclatura";

export const itemsService = {
    async getAll() {
        const supabase = createClient();
        try {
            const { data, error } = await supabase
                .from("items")
                .select("*, containers(label), locations(name)")
                .order("created_at", { ascending: false });

            if (error) throw error;
            if (data) {
                // Sincronizar localmente (sin los joins para no romper el esquema de Dexie)
                const itemsToStore = data.map(({ containers, locations, ...item }) => item as Item);
                await db.items.bulkPut(itemsToStore);
            }
            return data as (Item & { containers: { label: string } | null, locations: { name: string } | null })[];
        } catch (e) {
            console.warn("Offline: returning all items from local DB", e);
            const items = await db.items.toArray();
            // Enriquecer localmente si es necesario
            return items as (Item & { containers: { label: string } | null, locations: { name: string } | null })[];
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
            ai_metadata?: Record<string, unknown> | null;
            file?: File; // optional blob for offline storage
        }
    ) {
        const supabase = createClient();
        const user = await getDevUser();
        const userId = user?.id;

        if (!userId) throw new Error("Not authenticated");

        // Generar Número de Serie Normativo
        const count = await db.items.count();
        const catCode = getCategoryCode(params.category);
        const serialNumber = params.serial_number || generateSerialNumber(catCode, count + 1);

        const itemId = params.id || crypto.randomUUID();
        const itemData: Item = {
            id: itemId,
            container_id: params.container_id ?? null,
            location_id: params.location_id ?? null,
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
            serial_number: serialNumber,
            ai_metadata: params.ai_metadata ?? {},
            specifications: params.specifications ?? {},
            related_items: params.related_items ?? [],
            family_group_id: params.family_group_id ?? null,
            user_id: userId,
            created_at: new Date().toISOString()
        };

        // Validación de Capacidad
        if (itemData.container_id) {
            const [container, itemCount] = await Promise.all([
                db.containers.get(itemData.container_id),
                db.items.where("container_id").equals(itemData.container_id).count()
            ]);
            
            if (container && container.max_capacity) {
                if (itemCount >= container.max_capacity) {
                    throw new Error(`El contenedor "${container.label}" está lleno (${itemCount}/${container.max_capacity}).`);
                }
            }
        }

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
            return data?.[0] as unknown as { container_id: string; containers: { label: string } } | undefined;
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

    async search(query: string, signal?: AbortSignal) {
        if (!query.trim()) return [];
        const supabase = createClient();
        
        try {
            const { data, error } = await supabase
                .from("items")
                .select("*, containers(label)")
                .or(`name.ilike.%${query}%,category.ilike.%${query}%,tags.cs.{${query}}`)
                .abortSignal(signal);

            if (error) throw error;
            return data as (Item & { containers: { label: string } })[];
        } catch (e: unknown) {
            if (e instanceof Error && e.name === 'AbortError') return [];
            
            console.warn("Search falling back to local DB", e);
            const lowerQuery = query.toLowerCase();
            const items = await db.items.filter(item => 
                item.name.toLowerCase().includes(lowerQuery) ||
                (item.category || "").toLowerCase().includes(lowerQuery) ||
                item.tags.some(t => t.toLowerCase().includes(lowerQuery))
            ).toArray();

            // Enriquecer con labels de contenedores locales
            const results = await Promise.all(items.map(async item => {
                const container = await db.containers.get(item.container_id);
                return { ...item, containers: { label: container?.label || "Caja" } };
            }));
            
            return results;
        }
    },

    async update(id: string, params: Partial<Item>) {
        const supabase = createClient();
        
        // Local update
        await db.items.update(id, params);
        
        try {
            const { data, error } = await supabase
                .from("items")
                .update(params)
                .eq("id", id)
                .select("*")
                .single();
                
            if (error) throw error;
            return data as Item;
        } catch (e) {
            console.warn("Offline: Queuing item update", e);
            await db.sync_queue.add({
                action: "update",
                type: "item",
                data: { id, ...params },
                timestamp: Date.now()
            });
            return (await db.items.get(id)) as Item;
        }
    },

    async returnItem(itemId: string, targetContainerId?: string) {
        const supabase = createClient();
        
        // 1. Update pick_list_items status to 'returned'
        await supabase
            .from('pick_list_items')
            .update({ status: 'returned' })
            .eq('item_id', itemId)
            .eq('status', 'picked');
            
        // 2. Update item to clear borrowed_by and optionally change container
        const updateData: Partial<Item> = {
            borrowed_by: null
        };
        
        if (targetContainerId) {
            updateData.container_id = targetContainerId;
        }
        
        return await this.update(itemId, updateData);
    },

    async getActiveLoans() {
        const supabase = createClient();
        try {
            // Buscamos items que tengan un prestatario asignado
            const { data, error } = await supabase
                .from("items")
                .select("*, containers(label)")
                .not("borrowed_by", "is", null);
            
            if (error) throw error;
            return data as (Item & { containers: { label: string } })[];
        } catch (e) {
            console.error("Error fetching active loans", e);
            return [];
        }
    },

    async exportToCSV() {
        const data = await this.getAll();

        const headers = ["Nombre", "Categoría", "Cantidad", "Estado", "Tipo", "Etiquetas"];
        const rows = (data || []).map((item: Item) => [
            item.name,
            item.category || "",
            String(item.quantity),
            item.condition,
            item.item_type,
            (item.tags || []).join("; ")
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((row: string[]) => row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
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
