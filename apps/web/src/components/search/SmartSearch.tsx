'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Camera, Loader2, ChevronDown, ChevronRight, DollarSign, Tag, Sparkles } from 'lucide-react';
import { debounce } from 'lodash';
import { semanticSearch, SearchResult } from '@/core/services/semanticSearch';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SmartSearchProps {
  onSelect?: (item: SearchResult) => void;
  placeholder?: string;
  className?: string;
}

export function SmartSearch({ onSelect, placeholder = "Buscar objeto...", className = "" }: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isCameraMode, setIsCameraMode] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Búsqueda debounced
  const debouncedSearch = useCallback(
    debounce(async (searchText: string, imageStr: string | null) => {
      if (!searchText.trim() && !imageStr) {
        setResults([]);
        return;
      }
      
      setIsLoading(true);
      try {
        const searchResults = await semanticSearch.search({
          text: searchText,
          image: imageStr || undefined,
          limit: 10
        });
        setResults(searchResults);
        setShowResults(true);
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearch(query, capturedImage);
    return () => debouncedSearch.cancel();
  }, [query, capturedImage, debouncedSearch]);

  // Cerrar resultados al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Iniciar cámara
  const startCamera = async () => {
    setIsCameraMode(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  // Capturar foto
  const capturePhoto = async () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageDataUrl);
      stopCamera();
    }
  };

  // Detener cámara
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraMode(false);
  };

  // Seleccionar resultado
  const handleSelect = (result: SearchResult) => {
    setSelectedResult(result);
    setShowResults(false);
    onSelect?.(result);
  };

  // Limpiar búsqueda
  const clearSearch = () => {
    setQuery('');
    setCapturedImage(null);
    setResults([]);
    setSelectedResult(null);
  };

  return (
    <div ref={searchRef} className={cn("relative w-full max-w-2xl mx-auto", className)}>
      {/* Barra de búsqueda Premium */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative group">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors">
            <Search className="w-5 h-5" />
          </div>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowResults(true)}
            placeholder={capturedImage ? "Analizando imagen..." : placeholder}
            className="w-full pl-12 pr-12 py-4 bg-zinc-900/50 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white font-medium placeholder:text-zinc-600 transition-all backdrop-blur-xl"
            disabled={!!capturedImage}
          />
          
          <AnimatePresence>
            {(query || capturedImage) && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-zinc-500"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        
        <button
          onClick={startCamera}
          className={cn(
            "h-14 w-14 flex items-center justify-center rounded-2xl border transition-all active:scale-95",
            capturedImage 
              ? "bg-green-500/10 border-green-500/30 text-green-500" 
              : "bg-zinc-900/50 border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800"
          )}
          title="Escanear con cámara"
        >
          <Camera className="w-6 h-6" />
        </button>
      </div>
      
      {/* Resultados de búsqueda */}
      <AnimatePresence>
        {showResults && (results.length > 0 || isLoading) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full mt-3 w-full bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl z-50 max-h-[480px] overflow-hidden backdrop-blur-2xl"
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-12 gap-4">
                <div className="relative">
                   <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                   <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-blue-400 animate-pulse" />
                </div>
                <p className="text-zinc-500 text-sm font-black uppercase tracking-widest">Buscando en la Red Neuronal...</p>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[480px] py-2">
                {results.map((result) => (
                  <SearchResultCard
                    key={result.id}
                    result={result}
                    onSelect={() => handleSelect(result)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Vista previa de imagen capturada */}
      {capturedImage && !selectedResult && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 flex flex-col items-center"
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full opacity-50 animate-pulse" />
            <div className="relative w-40 h-40 rounded-[2.5rem] overflow-hidden border-2 border-blue-500/30 shadow-2xl">
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              <button
                onClick={() => setCapturedImage(null)}
                className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md text-white rounded-xl hover:bg-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs font-black text-blue-400 uppercase tracking-widest">Analizando Pixeles</p>
        </motion.div>
      )}

      {/* Modal de cámara */}
      {isCameraMode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl">
          <div className="relative w-full max-w-xl bg-zinc-950 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
            <div className="relative aspect-video bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40">
                 <div className="w-full h-full border-2 border-white/20 rounded-2xl relative">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-500/30 animate-scan-line" />
                 </div>
              </div>
            </div>
            
            <div className="flex gap-4 p-8">
              <button
                onClick={capturePhoto}
                className="flex-[2] py-4 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Camera className="w-5 h-5" /> Escanear
              </button>
              <button
                onClick={stopCamera}
                className="flex-1 py-4 bg-zinc-900 text-zinc-400 rounded-2xl font-bold hover:text-white transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Resultado seleccionado */}
      {selectedResult && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <SelectedItemCard item={selectedResult} onClear={() => setSelectedResult(null)} />
        </motion.div>
      )}
    </div>
  );
}

function SearchResultCard({ result, onSelect }: { result: SearchResult; onSelect: () => void }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div
      className="p-4 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-b-0 transition-colors group"
      onClick={onSelect}
    >
      <div className="flex gap-4">
        {result.imageUrl && (
          <div className="w-16 h-16 flex-shrink-0 relative bg-zinc-900 rounded-2xl overflow-hidden border border-white/5">
            <img src={result.imageUrl} alt={result.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-bold text-white tracking-tight truncate group-hover:text-blue-400 transition-colors">{result.name}</h4>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                {result.brand && <span className="text-zinc-400">{result.brand}</span>}
                {result.brand && result.category && ' · '}
                {result.category && <span>{result.category}</span>}
              </p>
            </div>
            {result.price && (
              <div className="flex items-center text-green-500 font-bold bg-green-500/10 px-2 py-1 rounded-lg text-sm">
                <DollarSign className="w-3.5 h-3.5" />
                <span>{result.price}</span>
              </div>
            )}
          </div>
          
          <p className="text-xs text-zinc-600 mt-1 line-clamp-1 italic">{result.description}</p>
          
          {/* Tags de atributos */}
          {Object.keys(result.attributes).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {Object.entries(result.attributes).slice(0, 2).map(([key, value]) => (
                <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-900 border border-white/5 text-zinc-500 text-[9px] font-black uppercase tracking-widest rounded-md">
                  <Tag className="w-2.5 h-2.5" />
                  {String(value)}
                </span>
              ))}
            </div>
          )}
          
          {/* Items similares */}
          {result.similarItems && result.similarItems.length > 0 && (
            <div className="mt-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors"
              >
                {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                {result.similarItems.length} Similares
              </button>
              
              <AnimatePresence>
                {expanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 space-y-3 overflow-hidden border-l-2 border-white/5 pl-4"
                  >
                    {result.similarItems.map((similar) => (
                      <div key={similar.id} className="flex gap-3 text-sm group/similar">
                        {similar.imageUrl && (
                          <div className="w-10 h-10 bg-zinc-900 rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
                            <img src={similar.imageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-bold text-zinc-400 text-xs group-hover/similar:text-white transition-colors">{similar.name}</p>
                          {similar.price && (
                            <p className="text-[10px] font-black text-green-500/80 uppercase tracking-widest">${similar.price}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SelectedItemCard({ item, onClear }: { item: SearchResult; onClear: () => void }) {
  return (
    <div className="group relative border border-white/10 rounded-[2.5rem] p-8 bg-zinc-900/40 backdrop-blur-2xl shadow-2xl overflow-hidden">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full" />
      
      <div className="relative flex flex-col md:flex-row gap-8">
        {item.imageUrl && (
          <div className="w-full md:w-48 h-48 bg-black rounded-[2rem] shadow-2xl overflow-hidden flex-shrink-0 border border-white/10 group-hover:scale-[1.02] transition-transform duration-700">
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Candidato Detectado</span>
              <h3 className="text-3xl font-black text-white tracking-tight leading-tight">{item.name}</h3>
              <div className="flex flex-wrap gap-2 mt-1">
                {item.brand && <span className="text-xs font-bold text-zinc-400 bg-zinc-800 px-3 py-1 rounded-lg">Marca: {item.brand}</span>}
                {item.category && <span className="text-xs font-bold text-zinc-400 bg-zinc-800 px-3 py-1 rounded-lg">{item.category}</span>}
              </div>
            </div>
            
            <button
              onClick={onClear}
              className="p-2 bg-white/5 hover:bg-red-500/20 text-zinc-500 hover:text-red-500 rounded-xl transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4">
             {item.price && (
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black text-green-500">$</span>
                  <span className="text-4xl font-black text-white tracking-tighter">{item.price.toLocaleString()}</span>
                </div>
              )}
             <p className="mt-3 text-sm text-zinc-500 leading-relaxed max-w-lg">{item.description}</p>
          </div>
          
          {Object.keys(item.attributes).length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/5">
              <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3">Ficha Técnica</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(item.attributes).slice(0, 6).map(([key, value]) => (
                  <div key={key} className="flex flex-col">
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{key}</span>
                    <span className="text-xs font-black text-zinc-300 truncate">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => window.open(`https://${item.source}.com`, '_blank')}
              className="flex-1 px-6 py-4 bg-zinc-950 border border-white/10 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl"
            >
              Ver en {item.source}
            </button>
            
            <button
              className="flex-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-lg tracking-tight hover:bg-blue-500 hover:shadow-2xl hover:shadow-blue-500/40 transition-all active:scale-[0.98] shadow-xl shadow-blue-500/20"
            >
              Agregar a Inventario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
