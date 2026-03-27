import { cache } from '@/core/utils/cache';

export interface RecognizedObject {
  name: string;
  brand?: string;
  model?: string;
  category: string;
  confidence: number;
  attributes: {
    color?: string;
    size?: string;
    material?: string;
    condition?: string;
  };
  possibleMatches: SearchSuggestion[];
}

export interface SearchSuggestion {
  id: string;
  name: string;
  brand: string;
  model?: string;
  category: string;
  imageUrl?: string;
  price?: number;
  description?: string;
  source: 'amazon' | 'mercadolibre' | 'bestbuy' | 'walmart' | 'local';
  confidence: number;
  matchScore: number;
  attributes: Record<string, any>;
}

class ObjectRecognitionService {
  // Reconocimiento principal usando Gemini/Groq como fallback de Google Vision
  async recognizeObject(imageDataUrl: string): Promise<RecognizedObject> {
    const cacheKey = `recognition_${this.hashImage(imageDataUrl)}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    try {
      // 1. Intentar con nuestro servicio de IA (Gemini -> Groq)
      // Usamos las Edge Functions que ya tenemos configuradas
      const aiResult = await this.analyzeWithEdgeFunctions(imageDataUrl);
      
      // 2. Combinar con resultados de búsqueda de productos
      const enriched = await this.enrichWithProductData(aiResult);
      
      await cache.set(cacheKey, enriched);
      return enriched;
    } catch (error) {
      console.error('Error en reconocimiento:', error);
      throw new Error('No se pudo reconocer el objeto');
    }
  }

  private async analyzeWithEdgeFunctions(imageDataUrl: string): Promise<RecognizedObject> {
    // Intentar primero con Gemini Edge Function
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ image: imageDataUrl })
      });

      if (response.ok) {
        const data = await response.json();
        return this.mapToRecognizedObject(data);
      }
    } catch (e) {
      console.warn('Gemini failed, trying Groq...', e);
    }

    // Fallback a Groq Edge Function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/groq-analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ image: imageDataUrl })
    });

    if (!response.ok) throw new Error('Ambos servicios de IA fallaron');
    
    const data = await response.json();
    return this.mapToRecognizedObject(data);
  }

  private mapToRecognizedObject(data: any): RecognizedObject {
    return {
      name: data.name || 'Objeto Desconocido',
      brand: data.brand || (data.tags && data.tags[0]),
      category: data.category || 'Otros',
      confidence: data.confidence || 0.8,
      attributes: {
        color: data.attributes?.color || data.color,
        material: data.attributes?.material,
        condition: 'New'
      },
      possibleMatches: []
    };
  }

  private async enrichWithProductData(recognizedObject: RecognizedObject): Promise<RecognizedObject> {
    const suggestions = await this.searchExternalAPIs(recognizedObject);
    recognizedObject.possibleMatches = suggestions;
    return recognizedObject;
  }

  private async searchExternalAPIs(object: RecognizedObject): Promise<SearchSuggestion[]> {
    const query = `${object.brand || ''} ${object.name}`.trim();
    const allSuggestions: SearchSuggestion[] = [];
    
    const searchPromises = [
      this.searchMarketplace('amazon', query),
      this.searchMarketplace('mercadolibre', query),
    ];
    
    const results = await Promise.allSettled(searchPromises);
    for (const result of results) {
      if (result.status === 'fulfilled') allSuggestions.push(...result.value);
    }
    
    return this.deduplicateAndSort(allSuggestions);
  }

  private async searchMarketplace(source: string, query: string): Promise<SearchSuggestion[]> {
    try {
      const response = await fetch(`/api/search/${source}?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      return (data.items || data.results || []).map((item: any) => ({
        id: `${source}_${item.asin || item.id}`,
        name: item.title,
        brand: item.brand || '',
        category: item.category || '',
        imageUrl: item.imageUrl || item.thumbnail,
        price: item.price,
        description: item.description,
        source: source as any,
        confidence: 0.8,
        matchScore: 0.9,
        attributes: item.attributes || {},
      }));
    } catch (e) {
      console.error(`Error searching ${source}:`, e);
      return [];
    }
  }

  private deduplicateAndSort(suggestions: SearchSuggestion[]): SearchSuggestion[] {
    const unique = new Map<string, SearchSuggestion>();
    for (const s of suggestions) {
      const key = `${s.name}_${s.brand}`.toLowerCase();
      if (!unique.has(key)) unique.set(key, s);
    }
    return Array.from(unique.values()).sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
  }

  private hashImage(imageDataUrl: string): string {
    let hash = 0;
    const str = imageDataUrl.slice(0, 1000);
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }
}

export const objectRecognition = new ObjectRecognitionService();
