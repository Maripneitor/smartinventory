'use client';

import { useEffect, useState } from 'react';
import { InventoryPage } from '@/views/InventoryPage';
import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();
import { InventoryItem, Box } from '@/core/types/domain';
import { Loader2 } from 'lucide-react';

export default function InventoryNextPage() {
  const [data, setData] = useState<{ items: InventoryItem[], boxes: Box[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [itemsRes, boxesRes] = await Promise.all([
          supabase.from('items').select('*'),
          supabase.from('containers').select('*')
        ]);

        if (itemsRes.error) throw itemsRes.error;
        if (boxesRes.error) throw boxesRes.error;

        setData({
          items: itemsRes.data as InventoryItem[],
          boxes: boxesRes.data.map((b: any) => ({
            id: b.id,
            location_id: b.location_id,
            name: b.label || b.name || 'Sin nombre',
            qr_code: b.qr_payload
          })) as Box[]
        });
      } catch (error) {
        console.error('Error fetching inventory data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-zinc-500 font-bold animate-pulse uppercase tracking-widest text-[10px]">Cargando Inventario Inteligente...</p>
      </div>
    );
  }

  if (!data) {
    return <div>Error al cargar el inventario.</div>;
  }

  return <InventoryPage initialData={data} />;
}
