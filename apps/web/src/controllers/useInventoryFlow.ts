import { useState, useCallback, useMemo } from 'react';
import { InventoryItem, Box, DraftItem } from '@/core/types/domain';
import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();
import { toast } from 'sonner';

export const useInventoryFlow = (initialItems: InventoryItem[], boxes: Box[]) => {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. OPTIMIZACIÓN CRÍTICA: useMemo evita que el array se filtre en cada render.
  // Solo se recalcula si cambian los "items" o la "caja seleccionada".
  const currentBoxItems = useMemo(() => {
    if (!selectedBoxId) return [];
    return items.filter(item => item.container_id === selectedBoxId);
  }, [items, selectedBoxId]);

  // 2. FLUJO DE ASIGNACIÓN: Recibe el resultado de la IA y lo guarda en la DB
  const assignItemToBox = useCallback(async (draft: DraftItem, boxId: string) => {
    setIsProcessing(true);
    try {
      // Optimizamos la inserción usando Supabase
      const { data, error } = await supabase
        .from('items')
        .insert([{ ...draft, container_id: boxId }])
        .select()
        .single();

      if (error) throw error;

      // Actualizamos el estado local (Optimistic UI)
      setItems(prev => [...prev, data as InventoryItem]);
      toast.success(`"${draft.name}" guardado en la caja con éxito.`);
      
      return true;
    } catch (error: any) {
      toast.error(`Error al asignar: ${error.message}`);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // 3. FLUJO DE ELIMINACIÓN SEGURO
  const removeItem = useCallback(async (itemId: string) => {
    try {
      await supabase.from('items').delete().eq('id', itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
      toast.info("Objeto eliminado del inventario.");
    } catch (error) {
      toast.error("No se pudo eliminar el objeto.");
    }
  }, []);

  return {
    items, // Todos los items
    currentBoxItems, // Solo los de la caja actual (Rápido)
    selectedBoxId,
    setSelectedBoxId,
    isProcessing,
    assignItemToBox,
    removeItem
  };
};
