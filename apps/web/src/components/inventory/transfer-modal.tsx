"use client";

import { useState } from "react";
import { 
  X, 
  Search, 
  QrCode, 
  ArrowRight, 
  Package, 
  CheckCircle2, 
  Sparkles,
  Minus,
  Plus,
  Thermometer,
  Weight,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { type Item } from "@/entities/item/schema";
import { type Container } from "@/entities/container/schema";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceContainer: Container;
  items: Item[];
  onTransfer: (selectedItems: { id: string, quantity: number }[], destinationId: string) => Promise<void>;
}

export function TransferModal({ isOpen, onClose, sourceContainer, items, onTransfer }: TransferModalProps) {
  const [step, setStep] = useState(1); // 1: Destination, 2: Items, 3: Success
  const [search, setSearch] = useState("");
  const [selectedDestination, setSelectedDestination] = useState<Container | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => {
      if (prev[itemId]) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: 1 };
    });
  };

  const updateQty = (itemId: string, delta: number, maxQty: number) => {
    setSelectedItems(prev => {
      const current = prev[itemId] || 1;
      const next = Math.max(1, Math.min(maxQty, current + delta));
      return { ...prev, [itemId]: next };
    });
  };

  const handleExecute = async () => {
    if (!selectedDestination) return;
    setLoading(true);
    try {
      const transferData = Object.entries(selectedItems).map(([id, quantity]) => ({ id, quantity }));
      await onTransfer(transferData, selectedDestination.id);
      setStep(3);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-xl"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="relative w-full max-w-xl bg-surface-container-lowest rounded-[3rem] shadow-2xl border border-outline-variant/10 overflow-hidden flex flex-col max-h-[85vh] cloud-shadow"
      >
        {/* Header Editorial */}
        <div className="p-10 border-b border-outline-variant/5 flex items-center justify-between bg-surface-container-low/50">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-2">
                Logística de Tránsito
            </div>
            <h3 className="font-headline text-3xl font-bold text-on-surface tracking-tighter">Transferir Contenido</h3>
            <p className="text-sm font-body text-on-surface-variant mt-1">
                Desde la unidad <span className="text-on-surface font-bold">{sourceContainer.label}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="h-14 w-14 flex items-center justify-center rounded-2xl bg-surface-container-highest/20 text-on-surface hover:bg-surface-container transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                className="space-y-10"
              >
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/60 block">Identificar Destino</label>
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
                    <input 
                      type="text"
                      placeholder="Busca o escanea un contenedor..."
                      className="w-full h-16 pl-14 pr-14 bg-surface-container-low border border-outline-variant/10 rounded-2xl font-body text-base focus:outline-none focus:border-primary transition-all cloud-shadow"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <button className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-surface-container-lowest border border-outline-variant/10 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
                      <QrCode className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                    <Sparkles className="h-3 w-3" /> Rutas Sugeridas
                  </p>
                  
                  {[
                    { label: "Estante de Electrónica B", meta: "Clima Óptimo (22°C)", cap: "45% Capacidad" },
                    { label: "Área de Despacho 4", meta: "Frecuencia de Uso: Alta", cap: "12% Capacidad" }
                  ].map((sug, i) => (
                    <div 
                        key={i}
                        onClick={() => {
                          setSelectedDestination({ id: `sug-${i}`, label: sug.label } as Container);
                          setStep(2);
                        }}
                        className="p-6 bg-surface-container-low/30 border border-outline-variant/10 rounded-[2rem] flex items-center justify-between cursor-pointer hover:bg-surface-container-highest/50 hover:border-primary/20 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-surface-container-highest flex items-center justify-center text-on-surface group-hover:scale-110 transition-transform">
                                <Package className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-on-surface">{sug.label}</p>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter text-emerald-600">
                                        <Thermometer className="h-3 w-3" /> {sug.meta}
                                    </span>
                                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter text-primary">
                                        <Layers className="h-3 w-3" /> {sug.cap}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <ArrowRight className="h-6 w-6 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between px-2">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/60">Selección de Manifiesto</p>
                        <h4 className="text-xl font-headline font-bold text-on-surface">Escoge los objetos</h4>
                    </div>
                    <button className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:underline">Marcar Todo</button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {items.map((item) => {
                    const isSelected = !!selectedItems[item.id];
                    return (
                      <div 
                        key={item.id}
                        className={cn(
                          "p-6 rounded-3xl border transition-all flex items-center justify-between gap-6",
                          isSelected ? "bg-primary/5 border-primary/20 cloud-shadow" : "bg-surface-container-low/20 border-outline-variant/5 hover:border-outline-variant/20"
                        )}
                      >
                        <div 
                          className="flex items-center gap-4 flex-1 cursor-pointer"
                          onClick={() => toggleItem(item.id)}
                        >
                          <div className={cn(
                            "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all",
                            isSelected ? "bg-primary border-primary text-on-primary" : "bg-surface border-outline-variant/30"
                          )}>
                            {isSelected && <CheckCircle2 className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-bold text-on-surface truncate">{item.name}</p>
                            <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest mt-0.5">ID: {item.id.slice(0, 8)}</p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-3 bg-surface-container-highest/30 p-1.5 rounded-2xl border border-outline-variant/10">
                            <button 
                              onClick={(e) => { e.stopPropagation(); updateQty(item.id, -1, 99); }}
                              className="h-9 w-9 flex items-center justify-center rounded-xl bg-surface-container-lowest text-on-surface hover:bg-primary hover:text-white transition-all shadow-sm"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="text-sm font-black w-6 text-center text-on-surface">{selectedItems[item.id]}</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); updateQty(item.id, 1, 99); }}
                              className="h-9 w-9 flex items-center justify-center rounded-xl bg-surface-container-lowest text-on-surface hover:bg-primary hover:text-white transition-all shadow-sm"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-16 flex flex-col items-center text-center space-y-8"
              >
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl"></div>
                    <div className="relative w-32 h-32 rounded-[2.5rem] bg-emerald-500 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30">
                        <CheckCircle2 className="h-16 w-16" />
                    </div>
                </div>
                <div>
                  <h3 className="font-headline text-4xl font-bold text-on-surface tracking-tighter">Transferencia Confirmada</h3>
                  <p className="font-body text-on-surface-variant text-lg mt-4 max-w-sm">
                    Se han reubicado <span className="text-on-surface font-bold">{Object.keys(selectedItems).length} objetos</span> exitosamente en <span className="text-primary font-bold">{selectedDestination?.label}</span>.
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  className="h-16 px-12 bg-on-surface text-surface rounded-2xl font-bold text-sm uppercase tracking-widest active:scale-95 transition-all shadow-xl"
                >
                  Cerrar Manifiesto
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {step < 3 && (
          <div className="p-10 border-t border-outline-variant/5 bg-surface-container-low/50 flex items-center justify-between">
            <button 
              onClick={step === 2 ? () => setStep(1) : onClose}
              className="h-14 px-8 text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {step === 2 ? "[ Volver ]" : "[ Cancelar ]"}
            </button>
            <button 
              disabled={loading || (step === 1 && !selectedDestination) || (step === 2 && Object.keys(selectedItems).length === 0)}
              onClick={step === 1 ? () => setStep(2) : handleExecute}
              className={cn(
                "h-16 px-10 rounded-2xl font-bold text-sm tracking-tight transition-all flex items-center gap-3",
                loading || (step === 1 && !selectedDestination) || (step === 2 && Object.keys(selectedItems).length === 0)
                  ? "bg-outline-variant/10 text-on-surface-variant/30 cursor-not-allowed"
                  : "bg-on-surface text-surface shadow-xl active:scale-95"
              )}
            >
              {loading ? "Sincronizando..." : step === 1 ? "Continuar Selección" : "Confirmar Movimiento"}
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
