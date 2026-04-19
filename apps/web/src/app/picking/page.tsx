'use client';

import { useEffect, useState } from 'react';
import { useLoanStore } from '@/core/stores/loanStore';
import { pickingService, type PickingStep } from '@/core/services/pickingService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MapPin, 
    Package, 
    CheckCircle2, 
    ChevronRight, 
    Loader2, 
    ArrowLeft,
    Box
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function PickingPage() {
  const { items: cartItems, clear } = useLoanStore();
  const [route, setRoute] = useState<PickingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickedItems, setPickedItems] = useState<Set<string>>(new Set());
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('smart_picking_progress');
    if (saved) {
      try {
        setPickedItems(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error('Failed to load picking progress', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('smart_picking_progress', JSON.stringify(Array.from(pickedItems)));
  }, [pickedItems]);

  useEffect(() => {
    async function generateRoute() {
      if (cartItems.length === 0) {
        setLoading(false);
        return;
      }
      try {
        const itemIds = cartItems.map(i => i.id);
        const optimizedRoute = await pickingService.generateOptimizedRoute(itemIds);
        setRoute(optimizedRoute);
      } catch (error) {
        console.error('Error generating route:', error);
        toast.error('No se pudo generar la ruta de recolección');
      } finally {
        setLoading(false);
      }
    }
    generateRoute();
  }, [cartItems]);

  const togglePick = (itemId: string) => {
    setPickedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleFinish = async () => {
    if (pickedItems.size === 0) {
      toast.warning('No has recolectado ningún objeto');
      return;
    }
    
    setIsFinishing(true);
    try {
      const userId = '4cef6da7-62a7-4855-80a6-27583e387a05'; // Mock user
      const list = await pickingService.checkoutItems(Array.from(pickedItems), userId);
      
      for (const itemId of pickedItems) {
        await pickingService.pickItem(list.id, itemId, userId);
      }
      
      toast.success('¡Recolección completada!', {
        description: `${pickedItems.size} objetos marcados como prestados.`
      });
      localStorage.removeItem('smart_picking_progress');
      clear();
    } catch (error) {
      console.error('Error finishing pick list:', error);
      toast.error('Error al procesar la recolección');
    } finally {
      setIsFinishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-on-surface-variant font-bold animate-pulse uppercase tracking-widest text-[10px]">Calculando Ruta Óptima...</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="h-20 w-20 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant/20">
          <Package className="h-10 w-10" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-headline font-bold">No hay objetos para recolectar</h2>
          <p className="text-on-surface-variant max-w-xs mx-auto">Añade objetos a tu lista de préstamo desde el inventario para generar una ruta.</p>
        </div>
        <Link href="/inventory">
          <button className="h-12 px-8 bg-primary text-on-primary rounded-2xl font-bold">Ir al Inventario</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <Link href="/inventory" className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Volver</span>
        </Link>
        <h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight">Modo Recolección</h1>
      </div>

      <div className="space-y-12">
        {route.map((step, stepIndex) => (
          <div key={step.location.id} className="relative">
            {/* Location Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-headline font-bold text-on-surface">{step.location.name}</h2>
                <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest">Ubicación de Origen</p>
              </div>
            </div>

            {/* Containers at this location */}
            <div className="space-y-6 ml-5 pl-8 border-l-2 border-outline-variant/30">
              {step.containers.map((cStep, cIndex) => (
                <div key={cStep.container.id} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
                      <Box className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold text-on-surface">Abrir Contenedor: <span className="text-primary">{cStep.container.label}</span></h3>
                  </div>

                  {/* Items in this container */}
                  <div className="grid grid-cols-1 gap-3">
                    {cStep.items.map((item) => (
                      <motion.div
                        key={item.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => togglePick(item.id)}
                        className={`group p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          pickedItems.has(item.id)
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-surface-container-lowest border-outline-variant/10 hover:border-primary/30'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                             pickedItems.has(item.id) ? 'bg-emerald-500 text-white' : 'bg-surface-container-high text-on-surface-variant'
                          }`}>
                            <Package className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className={`text-sm font-bold transition-colors ${pickedItems.has(item.id) ? 'text-emerald-700' : 'text-on-surface'}`}>
                                {item.name}
                            </h4>
                            <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-widest">{item.category || 'General'}</p>
                          </div>
                        </div>
                        
                        <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          pickedItems.has(item.id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-outline-variant'
                        }`}>
                          {pickedItems.has(item.id) && <CheckCircle2 className="h-4 w-4" />}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-surface via-surface to-transparent pointer-events-none">
        <div className="max-w-3xl mx-auto flex items-center justify-between p-4 bg-surface-container-highest/80 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-2xl pointer-events-auto">
          <div className="px-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Progreso</p>
            <p className="text-lg font-bold text-on-surface">{pickedItems.size} de {cartItems.length} recolectados</p>
          </div>
          <button 
            onClick={handleFinish}
            disabled={isFinishing || pickedItems.size === 0}
            className="h-14 px-8 bg-primary text-on-primary rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
          >
            {isFinishing ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
            Confirmar Préstamo
          </button>
        </div>
      </div>
    </div>
  );
}
