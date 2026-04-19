'use client';

import { useLoanStore } from '@/core/stores/loanStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Package, ArrowRight, Trash2 } from 'lucide-react';
import Link from 'next/link';

export function LoanCart() {
  const { items, removeItem, clear, isOpen, setOpen } = useLoanStore();

  if (items.length === 0 && !isOpen) return null;

  return (
    <>
      {/* Floating Trigger */}
      {!isOpen && items.length > 0 && (
        <motion.button
          initial={{ scale: 0, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setOpen(true)}
          className="fixed bottom-8 right-8 z-50 h-16 w-16 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center border-4 border-surface"
        >
          <ShoppingCart className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 h-6 w-6 bg-error text-on-error rounded-full text-[10px] font-black flex items-center justify-center border-2 border-surface">
            {items.length}
          </span>
        </motion.button>
      )}

      {/* Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-surface-container-lowest z-[70] shadow-2xl border-l border-outline-variant/30 flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-headline font-bold text-on-surface">Lista de Préstamo</h2>
                  <p className="text-xs text-on-surface-variant font-medium">{items.length} objetos seleccionados</p>
                </div>
                <button 
                  onClick={() => setOpen(false)}
                  className="h-10 w-10 rounded-xl hover:bg-surface-container transition-colors flex items-center justify-center text-on-surface-variant"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <AnimatePresence mode="popLayout">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9, x: 50 }}
                      className="group p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 flex items-center gap-4"
                    >
                      <div className="h-12 w-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary/40 group-hover:text-primary transition-colors">
                        <Package className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-on-surface truncate">{item.name}</h4>
                        <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest">{item.category || 'General'}</p>
                      </div>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="h-8 w-8 rounded-lg hover:bg-error/10 hover:text-error text-on-surface-variant/40 transition-all flex items-center justify-center"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {items.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-40">
                    <ShoppingCart className="h-16 w-16" />
                    <p className="font-bold">Tu lista está vacía</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-outline-variant/30 space-y-3">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-on-surface-variant mb-2">
                  <span>Subtotal</span>
                  <span>{items.length} Items</span>
                </div>
                <button 
                  onClick={clear}
                  className="w-full py-3 text-xs font-bold text-error uppercase tracking-widest hover:bg-error/5 rounded-xl transition-colors"
                >
                  Vaciar Lista
                </button>
                <Link 
                  href="/picking"
                  onClick={() => setOpen(false)}
                  className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95"
                >
                  Generar Ruta de Recolección
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
