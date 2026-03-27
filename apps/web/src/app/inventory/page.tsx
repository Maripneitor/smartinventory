'use client';

import { useState } from 'react';
import { SmartSearch } from '@/components/search/SmartSearch';
import { RobustScanner } from '@/components/inventory/RobustScanner';
import { SearchResult } from '@/core/services/semanticSearch';
import { Button } from '@/components/ui/button';
import { Camera, Plus, History, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InventoryPage() {
  const [showScanner, setShowScanner] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SearchResult | null>(null);
  
  const handleProductSelect = (product: SearchResult) => {
    setSelectedProduct(product);
  };
  
  return (
    <div className="flex flex-col gap-10 pb-20">
      {/* Header Premium */}
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Gestión de Activos</span>
                <h1 className="text-4xl font-black text-white tracking-tight">Mi Inventario</h1>
            </div>
            <Button 
                onClick={() => setShowScanner(true)}
                className="h-14 px-6 rounded-2xl bg-white text-black font-black flex items-center gap-3 shadow-2xl shadow-white/5 active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Nuevo Item</span>
            </Button>
        </div>
      </header>

      {/* Smart Search Section */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-3 px-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500">Búsqueda Semántica con IA</h2>
        </div>
        
        <SmartSearch
          onSelect={handleProductSelect}
          placeholder="Busca por nombre, marca o toma una foto..."
        />
      </section>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
        <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500">Objetos Recientes</h2>
                <button className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                    <History className="w-3 h-3" /> Ver Todo
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mock empty state */}
                <div className="col-span-full p-12 border border-white/5 bg-zinc-900/40 rounded-[2.5rem] flex flex-col items-center justify-center text-center gap-4">
                    <div className="h-16 w-16 bg-zinc-950 rounded-2xl flex items-center justify-center border border-white/5">
                        <Camera className="w-8 h-8 text-zinc-700" />
                    </div>
                    <div>
                        <p className="text-zinc-400 font-bold">Tu inventario está vacío</p>
                        <p className="text-[11px] text-zinc-600 font-medium max-w-[240px] mt-1">Utiliza el botón de arriba o la búsqueda inteligente para empezar.</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Info Sidebar / Selected Item Context */}
        <aside className="flex flex-col gap-6">
            <div className="px-2">
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500">Estado del Sistema</h2>
            </div>
            <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-[2rem] flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    </div>
                    <span className="text-xs font-bold text-zinc-300">Motores de IA Activos</span>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-600">
                        <span>Gemini 1.5 Flash</span>
                        <span className="text-green-500">Online</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                        <div className="w-[90%] h-full bg-blue-600" />
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-600">
                        <span>Llama 3.2 (Groq)</span>
                        <span className="text-green-500">Standby</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                        <div className="w-[100%] h-full bg-zinc-700" />
                    </div>
                </div>
            </div>
        </aside>
      </div>
      
      {/* Scanner Overlay */}
      <AnimatePresence>
        {showScanner && (
            <RobustScanner
              onItemAdded={() => {
                setShowScanner(false);
                // Aquí podrías recargar los datos
              }}
              onClose={() => setShowScanner(false)}
            />
        )}
      </AnimatePresence>

      {/* Selected product context info if needed */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 p-6 z-40 bg-linear-to-t from-black to-transparent pointer-events-none"
          >
             {/* El SelectedItemCard ya se muestra dentro de SmartSearch, 
                 pero aquí podrías tener acciones globales adicionales */}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
