'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Loader2, CheckCircle, AlertCircle, HelpCircle, RefreshCw } from 'lucide-react';
import { robustAI } from '@/core/services/robustAIService';
import { useToast } from '@/providers/toast-provider';

interface ScannerProps {
  onItemAdded?: () => void;
  onClose?: () => void;
  onAnalysisComplete?: (item: any, image: string | null) => void;
}

type Step = 'capture' | 'analyzing' | 'review' | 'saving' | 'complete';

export function RobustScanner({ onItemAdded, onClose, onAnalysisComplete }: ScannerProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('capture');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setError(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      let msg = 'No se pudo acceder a la cámara. Permite el acceso en la configuración.';
      if (err.name === 'NotFoundError') msg = 'No se encontró una cámara.';
      setError(msg);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Error al capturar la foto');
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setSelectedImage(imageDataUrl);
    stopCamera();
    setStep('analyzing');
    analyzeImage(imageDataUrl);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('Imagen demasiado grande (máx 10MB)'); return; }
    if (!file.type.startsWith('image/')) { setError('Por favor selecciona una imagen válida'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      if (isCameraActive) stopCamera();
      setStep('analyzing');
      analyzeImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (imageDataUrl: string) => {
    setError(null);
    try {
      const result = await robustAI.analyzeImage(imageDataUrl);
      setAnalysisResult(result);
      
      if (onAnalysisComplete) {
         onAnalysisComplete(result, imageDataUrl);
         return; // Bypasses internal review step and passes control to parent
      }

      if (result.needsReview) setStep('review');
      else {
        setStep('saving');
        await saveItem(result);
      }
    } catch (err: any) {
      setError(err.message || 'Error al analizar la imagen');
      setStep('capture');
      toast('Análisis fallido: ' + (err.message || 'Intenta nuevamente'), 'error');
    }
  };

  const saveItem = async (result: any) => {
    setStep('saving');
    try {
      // Simulación de guardado (el usuario integrará con su backend real)
      await new Promise(r => setTimeout(r, 1500));
      toast('¡Item agregado!: ' + result.name, 'success');
      setStep('complete');
      setTimeout(() => { onItemAdded?.(); onClose?.(); }, 1500);
    } catch (err) {
      setError('Error al guardar el item');
      setStep('review');
    }
  };

  const retryAnalysis = () => {
    if (selectedImage) {
      setRetryCount(prev => prev + 1);
      setStep('analyzing');
      analyzeImage(selectedImage);
    }
  };

  const reset = () => {
    setSelectedImage(null); setAnalysisResult(null); setError(null);
    setRetryCount(0); setStep('capture');
    if (isCameraActive) stopCamera();
  };

  useEffect(() => { return () => stopCamera(); }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {step === 'capture' && 'Escanear Objeto'}
            {step === 'analyzing' && 'Analizando con IA...'}
            {step === 'review' && 'Revisar Datos'}
            {step === 'saving' && 'Guardando...'}
            {step === 'complete' && '¡Completado!'}
          </h2>
          {(step === 'capture' || step === 'review') && (
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          )}
        </div>
        
        <div className="p-6">
          {step === 'capture' && (
            <div className="space-y-6">
              {isCameraActive ? (
                <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-inner">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-4/5 h-4/5 border-2 border-white/50 rounded-2xl border-dashed animate-pulse" />
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              ) : (
                <div className="aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center space-y-3">
                  <div className="p-4 bg-white rounded-full shadow-sm">
                    <Camera className="w-12 h-12 text-blue-500" />
                  </div>
                  <p className="text-gray-500 font-medium">Cámara lista para escanear</p>
                </div>
              )}
              
              <div className="flex gap-4">
                {!isCameraActive ? (
                  <>
                    <button onClick={startCamera} className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95">
                      <Camera className="w-6 h-6" /> Abrir Cámara
                    </button>
                    <label className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all cursor-pointer active:scale-95">
                      <Upload className="w-6 h-6" /> Subir Imagen
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </>
                ) : (
                  <>
                    <button onClick={capturePhoto} className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:shadow-lg transition-all active:scale-95">Capturar Objeto</button>
                    <button onClick={stopCamera} className="w-20 px-4 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all">✕</button>
                  </>
                )}
              </div>
              
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm flex items-start gap-3 border border-red-100">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              
              <div className="p-4 bg-blue-50/50 rounded-2xl text-sm text-blue-600 space-y-2 border border-blue-100">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <HelpCircle className="w-4 h-4" /> Consejos pro:
                </div>
                <p>• Iluminación frontal clara</p>
                <p>• Mantén el objeto quieto y centrado</p>
              </div>
            </div>
          )}

          {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="relative">
                <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-800">Cerebro de IA trabajando...</p>
                <p className="text-gray-500">Identificando nombre, marca y categoría</p>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              <div className="flex gap-6">
                {selectedImage && (
                  <div className="w-1/3 aspect-square bg-gray-50 rounded-2xl overflow-hidden border">
                    <img src={selectedImage} alt="Analizado" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nombre del Item</label>
                    <input type="text" value={analysisResult?.name || ''} onChange={e => setAnalysisResult({...analysisResult, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Categoría</label>
                    <select value={analysisResult?.category || 'Otros'} onChange={e => setAnalysisResult({...analysisResult, category: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium">
                      {['Electrónica', 'Herramientas', 'Ropa', 'Documentos', 'Muebles', 'Cocina', 'Deportes', 'Juguetes', 'Otros'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Descripción Inteligente</label>
                <textarea rows={3} value={analysisResult?.description} onChange={e => setAnalysisResult({...analysisResult, description: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium mt-1" />
              </div>

              <div className="flex gap-4 pt-2">
                <button onClick={retryAnalysis} className="px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" /> Reintentar
                </button>
                <button onClick={() => saveItem(analysisResult)} className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:shadow-lg transition-all active:scale-95">
                  Confirmar y Guardar
                </button>
              </div>
            </div>
          )}

          {step === 'saving' && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
              <p className="text-xl font-bold text-gray-800">Finalizando registro...</p>
            </div>
          )}

          {step === 'complete' && (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in slide-in-from-bottom duration-500">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">¡Item Registrado!</p>
              <p className="text-gray-500">Tu inventario se ha actualizado con éxito</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
