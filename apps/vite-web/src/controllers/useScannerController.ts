import { useState, useCallback } from 'react';
import { AIModel } from '@/models/ai.model';
import type { AIAnalysisResult } from '@/core/types/ai';
import { toast } from 'sonner'; // O tu librería de notificaciones

export const useScannerController = () => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback(async (base64Image: string) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // El controlador llama al modelo
      const result = await AIModel.analyzeImage(base64Image);
      
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
