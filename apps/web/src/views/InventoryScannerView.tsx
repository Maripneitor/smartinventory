'use client';

import React from 'react';
import { useScannerController } from '@/controllers/useScannerController';
import { CameraCapture } from '@/components/CameraCapture';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle, RefreshCcw, Box, Tag, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const InventoryScannerView: React.FC = () => {
  const { isAnalyzing, analysisResult, error, processImage, resetScanner } = useScannerController();

  const handleImageCaptured = (base64String: string) => {
    processImage(base64String);
  };

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 max-w-xl mx-auto min-h-screen">
      <header className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-blue-500 fill-blue-500/20" />
          Escaneo Inteligente
        </h2>
        <p className="text-zinc-500 font-medium text-sm leading-relaxed max-w-sm">
          Apunta a cualquier objeto para que nuestra IA identifique su nombre, categoría y etiquetas sugeridas.
        </p>
      </header>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-3xl flex items-center gap-3"
          >
             <AlertTriangle className="w-5 h-5 shrink-0" />
             <p className="text-xs font-bold">{error}</p>
          </motion.div>
        )}

        {isAnalyzing ? (
          <motion.div 
            key="analyzing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center justify-center p-20 bg-zinc-950/50 rounded-[2.5rem] border border-white/5 gap-8"
          >
            <div className="relative">
               <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
               <Spinner size="lg" className="relative z-10 text-blue-500" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-black text-white uppercase tracking-tighter">Motor de IA trabajando</p>
              <p className="text-sm text-zinc-500 max-w-[200px] mx-auto">SmartInventory está analizando el objeto, su estado y categoría...</p>
            </div>
          </motion.div>
        ) : !analysisResult ? (
          <motion.div 
            key="capture"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <CameraCapture onCapture={handleImageCaptured} />
          </motion.div>
        ) : (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6"
          >
            {/* Tarjeta de Resultado Premium */}
            <div className="relative border border-white/10 rounded-[3rem] p-10 bg-zinc-900 shadow-2xl overflow-hidden group">
              <div className="absolute top-0 right-0 p-8">
                 <div className="h-16 w-16 bg-blue-500/10 rounded-full border border-blue-500/20 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-blue-500 animate-in zoom-in duration-500" />
                 </div>
              </div>

              <div className="flex flex-col gap-8 relative z-10">
                <div className="space-y-1">
                   <div className="flex items-center gap-2 text-blue-400">
                      <Box className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{analysisResult.category}</span>
                   </div>
                   <h3 className="text-4xl font-black text-white leading-none tracking-tight">{analysisResult.name}</h3>
                </div>

                <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Descripción Sugerida</span>
                    <p className="text-sm text-zinc-400 font-medium leading-relaxed max-w-sm">
                        {analysisResult.description || "IA-Generated description based on image analysis."}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                   {analysisResult.suggestedTags.map(tag => (
                      <div key={tag} className="px-4 py-2 bg-zinc-800 rounded-full border border-white/5 text-[10px] font-bold text-zinc-300 flex items-center gap-2">
                         <Tag className="w-3 h-3 text-blue-500" />
                         {tag}
                      </div>
                   ))}
                </div>

                <div className="pt-6 border-t border-white/5 flex flex-col gap-4">
                  <div className="flex justify-between items-center px-2 text-[10px] font-black uppercase tracking-widest">
                     <span className="text-zinc-600">Confianza de IA</span>
                     <span className="text-blue-500">{(analysisResult.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                     <div 
                       className="h-full bg-blue-600 transition-all duration-1000 ease-out" 
                       style={{ width: `${analysisResult.confidence * 100}%` }} 
                     />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                    <Button 
                      className="h-16 rounded-4xl bg-white text-black font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 transition-all"
                      onClick={() => console.log('Confirmar y Guardar')}
                    >
                      Confirmar
                    </Button>
                    <Button 
                      variant="outline"
                      className="h-16 rounded-4xl border-white/10 text-white font-black uppercase text-[10px] tracking-widest hover:bg-zinc-800 active:scale-95 transition-all"
                      onClick={resetScanner}
                    >
                      <RefreshCcw className="w-4 h-4 mr-2" />
                      Otro
                    </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
