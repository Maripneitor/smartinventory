'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { type Item } from '@/entities/item/schema';
import { type Container } from '@/entities/container/schema';
import { Loader2, Search, Filter, Package, ChevronRight, LayoutGrid, List as ListIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function InventoryNextPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      try {
        const [itemsRes, boxesRes] = await Promise.all([
          supabase.from('items').select('*').order('created_at', { ascending: false }),
          supabase.from('containers').select('*')
        ]);

        if (itemsRes.error) throw itemsRes.error;
        if (boxesRes.error) throw boxesRes.error;

        setItems(itemsRes.data as Item[]);
        setContainers(boxesRes.data as Container[]);
      } catch (error) {
        console.error('Error fetching inventory data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-on-surface-variant font-bold animate-pulse uppercase tracking-widest text-[10px]">Cargando Inventario Inteligente...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">Inventario Global</h1>
          <p className="text-on-surface-variant mt-2">Gestiona todos tus objetos en un solo lugar.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="Buscar en el inventario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-sm"
            />
          </div>
          
          <div className="flex bg-surface-container-lowest p-1 rounded-xl border border-outline-variant/30">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              <ListIcon className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              layout
            >
              <Link 
                href={`/containers/${item.container_id}`}
                className={`group flex ${viewMode === 'grid' ? 'flex-col' : 'items-center'} bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all p-4 gap-4`}
              >
                <div className={`${viewMode === 'grid' ? 'w-full aspect-square' : 'w-16 h-16'} rounded-2xl bg-surface-container flex items-center justify-center relative overflow-hidden shrink-0`}>
                   {item.photo_path ? (
                      <div className="w-full h-full bg-surface-container-high animate-pulse" />
                   ) : (
                      <Package className="h-8 w-8 text-on-surface-variant/20" />
                   )}
                   <div className="absolute top-2 right-2 px-2 py-0.5 bg-surface-container-lowest/80 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-widest text-primary border border-primary/10">
                      {item.category || 'General'}
                   </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em]">{item.serial_number || item.id.slice(0, 8)}</span>
                  </div>
                  <h3 className="text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">{item.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {containers.find(c => c.id === item.container_id)?.label || 'Contenedor'}
                    </div>
                    {viewMode === 'list' && <ChevronRight className="h-4 w-4 text-on-surface-variant/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredItems.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center">
              <Package className="h-10 w-10 text-on-surface-variant" />
            </div>
            <div>
              <p className="text-lg font-bold text-on-surface">No hay resultados</p>
              <p className="text-sm text-on-surface-variant">Prueba con términos menos específicos o limpia los filtros.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
