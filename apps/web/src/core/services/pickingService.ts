import { createClient } from "@/lib/supabase/browser";
import { type Item } from "@/entities/item/schema";
import { type Container } from "@/entities/container/schema";
import { type Location } from "@/entities/location/schema";

export interface PickingStep {
    location: Location | { name: string; id: string };
    containers: {
        container: Container;
        items: Item[];
    }[];
}

export const pickingService = {
    /**
     * Genera una ruta óptima de recolección agrupando items por ubicación y contenedor.
     */
    async generateOptimizedRoute(itemIds: string[]): Promise<PickingStep[]> {
        const supabase = createClient();
        
        // 1. Obtener items con sus contenedores y ubicaciones
        // Hacemos un join para optimizar llamadas
        const { data: itemsData, error } = await supabase
            .from('items')
            .select(`
                *,
                containers:container_id (
                    *,
                    locations:location_id (*)
                )
            `)
            .in('id', itemIds);
            
        if (error) throw error;
        if (!itemsData) return [];

        const routeMap: Record<string, PickingStep> = {};

        itemsData.forEach((item: any) => {
            const container = item.containers;
            const location = container?.locations || { name: 'Sin ubicación', id: 'unknown' };
            
            const locationId = location.id;
            
            if (!routeMap[locationId]) {
                routeMap[locationId] = {
                    location: location,
                    containers: []
                };
            }
            
            let containerStep = routeMap[locationId].containers.find(c => c.container.id === container.id);
            
            if (!containerStep) {
                containerStep = {
                    container: container,
                    items: []
                };
                routeMap[locationId].containers.push(containerStep);
            }
            
            containerStep.items.push(item as Item);
        });

        // Convertir el mapa a un array ordenado (podríamos ordenar por nombre de ubicación)
        return Object.values(routeMap).sort((a, b) => a.location.name.localeCompare(b.location.name));
    },

    /**
     * Inicia un proceso de préstamo para una lista de items.
     */
    async checkoutItems(itemIds: string[], userId: string) {
        const supabase = createClient();
        
        // 1. Crear la pick_list
        const { data: list, error: listError } = await supabase
            .from('pick_lists')
            .insert([{ user_id: userId, status: 'active' }])
            .select()
            .single();
            
        if (listError) throw listError;

        // 2. Crear los pick_list_items
        const pickItems = itemIds.map(id => ({
            list_id: list.id,
            item_id: id,
            status: 'requested'
        }));

        const { error: itemsError } = await supabase
            .from('pick_list_items')
            .insert(pickItems);
            
        if (itemsError) throw itemsError;

        return list;
    },

    /**
     * Marca un item como recolectado (picked) y actualiza el estado del item.
     */
    async pickItem(listId: string, itemId: string, userId: string) {
        const supabase = createClient();
        
        // 1. Actualizar pick_list_item
        const { error: pickError } = await supabase
            .from('pick_list_items')
            .update({ status: 'picked' })
            .eq('list_id', listId)
            .eq('item_id', itemId);
            
        if (pickError) throw pickError;

        // 2. Actualizar item
        const { error: itemError } = await supabase
            .from('items')
            .update({ borrowed_by: userId })
            .eq('id', itemId);
            
        if (itemError) throw itemError;
        
        return true;
    }
};
