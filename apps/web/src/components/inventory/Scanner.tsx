'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, X, Sparkles, Loader2, CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScannerStore } from '@/core/stores/scannerStore';
import { analyzeWithAI } from '@/core/services/aiService';
import { compressImage } from '@/core/utils/imageCompression';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';


interface ScannerProps {
  onItemAdded?: () => void;
  onClose: () => void;
}

export function Scanner({ onItemAdded, onClose }: ScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { 
    currentImage, 
    isAnalyzing, 
    analysisResult, 
    setImage, 
    setAnalyzing, 
    setAnalysis, 
    reset 
  } = useScannerStore();

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert file to data URL
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setImage(dataUrl);
      
      try {
        setAnalyzing(true);
        
        // 1. Comprimir imagen localmente
        const compressed = await compressImage(dataUrl, { 
          maxWidth: 1200, 
          quality: 0.8 
        });
        
        // 2. Analizar con IA (Gemini -> Groq fallback)
        const result = await analyzeWithAI(compressed);
        
        setAnalysis(result);
        toast.success('¡Objeto identificado con éxito!');
      } catch (error) {
        console.error('Analysis failed:', error);
        toast.error('No se pudo analizar la imagen. Inténtalo de nuevo.');
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    reset();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
    >
      <div className="relative w-full max-w-lg bg-zinc-950 rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-blue-600/10 text-blue-500">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Escanear Objeto</h2>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black">Powered by Gemini & Groq</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 hover:text-white transition-all"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
          
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleCapture}
          />

          {!currentImage ? (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 min-h-[300px] border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 group hover:border-blue-500/50 hover:bg-zinc-900/50 transition-all"
            >
              <div className="h-20 w-20 flex items-center justify-center rounded-[2.5rem] bg-zinc-900 border border-white/10 group-hover:scale-110 transition-transform">
                <Camera className="h-10 w-10 text-zinc-700 group-hover:text-blue-500 transition-colors" />
              </div>
              <div className="text-center">
                <p className="font-bold text-zinc-400">Capturar Foto</p>
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Apunta al objeto para identificarlo</p>
              </div>
            </button>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Image Preview */}
              <div className="relative aspect-square rounded-[2.5rem] overflow-hidden border border-white/10 bg-black">
                <img src={currentImage} className={cn("w-full h-full object-cover transition-all duration-700", isAnalyzing && "opacity-40 blur-xl scale-110")} alt="Capture" />
                
                <AnimatePresence>
                  {isAnalyzing && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-blue-600/10 backdrop-blur-md"
                    >
                      <div className="h-16 w-16 flex items-center justify-center rounded-3xl bg-blue-600 shadow-2xl shadow-blue-500/50 animate-bounce">
                        <Sparkles className="h-8 w-8 text-white" />
                      </div>
                      <p className="text-sm font-black text-white uppercase tracking-[0.2em] animate-pulse">Analizando con IA...</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {analysisResult && !isAnalyzing && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-6 right-6 h-12 w-12 rounded-full bg-green-500 flex items-center justify-center shadow-2xl shadow-green-500/50"
                  >
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </motion.div>
                )}
              </div>

              {/* Results */}
              {analysisResult && !isAnalyzing && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-4 bg-zinc-900/50 border border-white/5 rounded-[2rem] p-6"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-black text-white tracking-tight">{analysisResult.name}</h3>
                      <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[9px] font-black text-blue-400 uppercase tracking-widest">
                        {analysisResult.category}
                      </span>
                    </div>
                    <p className="text-zinc-500 text-sm leading-relaxed">{analysisResult.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {analysisResult.tags.map((tag: string) => (
                      <span key={tag} className="px-3 py-1 bg-zinc-800 rounded-lg text-[10px] text-zinc-400 font-bold">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Confianza</p>
                      <p className="text-xs font-bold text-white">{Math.round(analysisResult.confidence * 100)}%</p>
                    </div>
                    <button 
                      onClick={handleReset}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-[10px] font-black uppercase text-zinc-400 transition-all"
                    >
                      <RefreshCcw className="h-3 w-3" /> Reintentar
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-zinc-950/50">
          <div className="flex gap-4">
            <Button 
              variant="secondary" 
              className="flex-1 h-14 rounded-2xl bg-zinc-900 text-zinc-400 font-bold"
              onClick={currentImage ? handleReset : onClose}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-[2] h-14 rounded-2xl text-lg font-black tracking-tight shadow-xl shadow-blue-500/20"
              disabled={!analysisResult || isAnalyzing}
              onClick={() => {
                // Lógica para guardar el item o abrir el formulario pre-llenado
                onItemAdded?.();
                onClose();
              }}
            >
              Confirmar e Indexar
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
