'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCcw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraCaptureProps {
  onCapture: (base64Image: string) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsActive(true);
      }
    } catch (err) {
      setError("No se pudo acceder a la cámara.");
    }
  };

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Capturamos a la resolución nativa del stream para máxima fidelidad inicial
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0);
        // Captura inicial con alta calidad; el controlador se encargará de la compresión proactiva
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        onCapture(dataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsActive(false);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="relative w-full aspect-square bg-zinc-950 rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
      {isActive ? (
        <div className="relative h-full w-full">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 border-2 border-white/20 rounded-[2.5rem] pointer-events-none m-8 border-dashed" />
          
          <div className="absolute bottom-8 left-0 right-0 flex justify-center px-8 gap-4">
             <Button 
               onClick={capture}
               className="h-20 w-20 rounded-full bg-white text-black hover:bg-zinc-200 shadow-2xl active:scale-95 transition-all p-0 flex items-center justify-center p-0"
             >
                <div className="h-16 w-16 rounded-full border-2 border-black/10 flex items-center justify-center">
                    <Zap className="fill-current" />
                </div>
             </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-12 text-center gap-6">
          <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center border border-white/10 shadow-xl">
             <Camera className="w-10 h-10 text-zinc-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-white font-bold">Cámara de Reconocimiento</h3>
            <p className="text-zinc-500 text-xs max-w-[200px] leading-relaxed">Posiciona el objeto en el centro para una mejor precisión de la IA.</p>
          </div>
          <Button 
            onClick={startCamera} 
            className="rounded-2xl bg-blue-600 text-white font-bold h-12 px-8 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
          >
            Iniciar Cámara
          </Button>
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
