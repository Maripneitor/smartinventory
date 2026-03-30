import { AIAnalysisResult } from '@/core/types/ai';
import { createClient } from '@/lib/supabase/browser'; 

const supabase = createClient();

export class AIModel {
  /**
   * Llama a nuestro backend seguro (Edge Function) en lugar de a Gemini directamente.
   * El backend se encarga de inyectar la API Key de forma segura.
   */
  static async analyzeImage(base64Image: string): Promise<AIAnalysisResult> {
    try {
      // Usamos Supabase Edge Functions para procesar la imagen
      const { data, error } = await supabase.functions.invoke('analyze-item', {
        body: { image: base64Image }
      });

      if (error) throw new Error(`Error en el backend de IA: ${error.message}`);
      
      return this.parseAndValidate(data);
    } catch (error) {
      console.error('[AIModel] Fallo en análisis:', error);
      throw error;
    }
  }

  // Capa de validación (Asegura que el contrato de datos se cumpla)
  private static parseAndValidate(rawData: any): AIAnalysisResult {
    if (!rawData.name && !rawData.nombre_corto) {
      throw new Error("El backend devolvió un formato inválido");
    }
    return {
      name: rawData.name || rawData.nombre_corto || "Desconocido",
      category: rawData.category || rawData.categoria || "Otros",
      confidence: rawData.confidence ?? rawData.confianza ?? 0.8,
      suggestedTags: rawData.suggestedTags ?? rawData.tags ?? [],
      description: rawData.description ?? rawData.descripcion ?? ''
    };
  }
}
