'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, Undo2, Package, MapPin, X, ArrowRight } from 'lucide-react';
import { type Item } from '@/entities/item/schema';
import { type Container } from '@/entities/container/schema';
import { cn } from '@/lib/utils';

interface QuickReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item & { borrower_name?: string };
  originalContainer?: Container & { locations?: { name: string } };
  onConfirm: () => void;
  onAltAction: () => void;
}

export function QuickReturnModal({ 
  isOpen, 
  onClose, 
  item, 
  originalContainer, 
  onConfirm, 
  onAltAction 
}: QuickReturnModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop glassmorphism */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-sky-900/20 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-[#F0F8FF] rounded-[2.5rem] shadow-2xl border border-white/40 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-[#1E90FF] text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Undo2 className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-headline font-black text-slate-800 tracking-tight">Devolver Objeto</h2>
              </div>
              <button 
                onClick={onClose}
                className="h-10 w-10 rounded-full hover:bg-white/50 transition-colors flex items-center justify-center text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-8 pb-10 space-y-8">
              {/* Object Card */}
              <div className="p-6 bg-white/60 rounded-[2rem] border border-white/80 shadow-sm backdrop-blur-sm flex items-center gap-6">
                <div className="h-20 w-20 rounded-2xl bg-white shadow-inner flex items-center justify-center text-4xl">
                  {item.category?.toLowerCase().includes('herramienta') ? '🔨' : '📦'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{item.name}</h3>
                  <div className="inline-flex px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">
                    Actualmente prestado a: {item.borrower_name || 'Alguien'}
                  </div>
                </div>
              </div>

              {/* Recommendation Block */}
              <div className="p-8 bg-white rounded-[2rem] border border-blue-100 shadow-xl shadow-blue-900/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <MapPin className="h-12 w-12 text-blue-600" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    Asistente Inteligente
                </p>
                <h4 className="text-lg font-bold text-slate-800 mb-2">Lugar Original Recomendado:</h4>
                <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <Package className="h-6 w-6 text-blue-600" />
                    <div>
                        <p className="font-bold text-blue-900">📦 {originalContainer?.label || 'Caja Desconocida'}</p>
                        <p className="text-xs text-blue-600/70 font-medium">({originalContainer?.locations?.name || 'Sin ubicación'})</p>
                    </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4 pt-2">
                <button 
                  onClick={onConfirm}
                  className="w-full h-20 bg-[#1E90FF] hover:bg-[#1C86EE] text-white rounded-[1.5rem] font-headline font-black text-lg shadow-xl shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  Confirmar Devolución Aquí
                  <Check className="h-6 w-6" />
                </button>
                <button 
                  onClick={onAltAction}
                  className="w-full py-4 text-slate-400 font-bold text-sm hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
                >
                  Lo guardé en otro lado...
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Subtle branding footer */}
            <div className="py-4 text-center border-t border-white/20 bg-white/20">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">SmartInventory Crystalline Logic</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
