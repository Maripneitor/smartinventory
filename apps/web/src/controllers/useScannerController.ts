import { useState, useCallback } from 'react';
import { AIModel } from '@/models/ai.model';
import { AIAnalysisResult } from '@/core/types/ai';
import { toast } from 'sonner';
import { compressImage } from '@/core/utils/imageCompression';

export const useScannerController = () => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback(async (base64Image: string) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // 1. COMPRESIÓN PROACTIVA (Pasamos de 5MB a ~150KB en milisegundos)
      const compressedImage = await compressImage(base64Image, 800, 0.7);

      // 2. LLAMADA SEGURA AL BACKEND
      const result = await AIModel.analyzeImage(compressedImage);
      
      if (result.confidence < 0.5) {
         toast.warning("La IA no está muy segura de qué es esto. Revisa los datos.");
      } else {
         toast.success("¡Objeto analizado con éxito!");
      }

      setAnalysisResult(result);
      return result;

    } catch (err: any) {
      const errorMsg = err.message || "No se pudo analizar la imagen.";
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const resetScanner = () => {
    setAnalysisResult(null);
    setError(null);
  };

  return {
    // Estado (ViewModel)
    isAnalyzing,
    analysisResult,
    error,
    // Acciones (Intents)
    processImage,
    resetScanner
  };
};
