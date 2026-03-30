import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, Upload, X, AlertCircle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64String: string) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture }) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

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
    onCapture(imageDataUrl);
    stopCamera();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('Imagen demasiado grande (máx 10MB)'); return; }
    if (!file.type.startsWith('image/')) { setError('Por favor selecciona una imagen válida'); return; }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      onCapture(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div className="space-y-4">
      {isCameraActive ? (
        <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-inner">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-4/5 h-4/5 border-2 border-white/50 rounded-2xl border-dashed animate-pulse" />
          </div>
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4">
            <button 
              onClick={capturePhoto} 
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform"
            >
              Capturar
            </button>
            <button 
              onClick={stopCamera} 
              className="p-3 bg-white/20 backdrop-blur-md text-white rounded-xl hover:bg-white/30 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center space-y-3">
            <div className="p-4 bg-white rounded-full shadow-sm">
              <Camera className="w-12 h-12 text-blue-500" />
            </div>
            <p className="text-gray-500 font-medium text-center px-4">Usa la cámara para identificar objetos al instante</p>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={startCamera} 
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:shadow-lg transition-all active:scale-95"
            >
              <Camera className="w-6 h-6" /> Abrir Cámara
            </button>
            <label className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all cursor-pointer active:scale-95">
              <Upload className="w-6 h-6" /> Subir
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm flex items-start gap-3 border border-red-100">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};
