import { cache } from '@/core/utils/cache';

export interface AIAnalysisResult {
  name: string;
  category: string;
  description: string;
  tags: string[];
  confidence: number;
  needsReview: boolean;
  alternativeNames?: string[];
}

interface AIError {
  type: 'network' | 'timeout' | 'rate_limit' | 'invalid_image' | 'unknown';
  message: string;
  retryable: boolean;
}

class RobustAIService {
  private maxRetries = 3;
  private retryDelays = [1000, 2000, 4000]; // Exponential backoff
  private readonly validCategories = [
    'Electrónica', 'Herramientas', 'Ropa', 'Documentos', 
    'Muebles', 'Cocina', 'Deportes', 'Juguetes', 'Otros'
  ];
  
  private readonly defaultResult: AIAnalysisResult = {
    name: 'Objeto no identificado',
    category: 'Otros',
    description: 'No se pudo analizar automáticamente. Por favor ingresa los datos manualmente.',
    tags: ['pendiente'],
    confidence: 0,
    needsReview: true
  };

  async analyzeImage(imageDataUrl: string): Promise<AIAnalysisResult> {
    if (!imageDataUrl) {
      console.error('No se proporcionó imagen');
      return { ...this.defaultResult, name: 'Imagen no válida' };
    }

    const cacheKey = `ai_analysis_${await this.hashImage(imageDataUrl)}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      console.log('✅ Usando resultado en caché');
      return cached;
    }

    if (!this.isValidImageFormat(imageDataUrl)) {
      console.error('Formato de imagen no soportado');
      return { ...this.defaultResult, name: 'Formato no soportado' };
    }

    let result: AIAnalysisResult | null = null;
    let lastError: AIError | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        result = await this.analyzeWithGemini(imageDataUrl);
        if (result && result.confidence > 0.3) {
          break;
        }
      } catch (error) {
        lastError = this.classifyError(error);
        console.warn(`⚠️ Intento ${attempt + 1} falló:`, lastError.message);
        if (!lastError.retryable) break;
        if (attempt < this.maxRetries - 1) await this.delay(this.retryDelays[attempt]);
      }
    }

    if (!result || result.confidence < 0.4) {
      console.log('🔄 Intentando con Groq (fallback)');
      try {
        const groqResult = await this.analyzeWithGroq(imageDataUrl);
        if (groqResult && groqResult.confidence > (result?.confidence || 0)) {
          result = groqResult;
        }
      } catch (error) {
        console.error('❌ Groq también falló:', error);
      }
    }

    if (!result || result.confidence < 0.3) {
      console.log('🔍 Usando análisis básico como último recurso');
      result = await this.basicImageAnalysis(imageDataUrl);
    }

    result = this.sanitizeResult(result);
    result.needsReview = result.confidence < 0.7;
    await cache.set(cacheKey, result, 86400000);
    return result;
  }

  private async analyzeWithGemini(imageDataUrl: string): Promise<AIAnalysisResult> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error('VITE_GEMINI_API_KEY no configurada');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      const [header, base64Data] = imageDataUrl.split(',');
      const mimeType = header.replace('data:', '').replace(';base64', '') || 'image/jpeg';

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Analiza esta imagen y extrae la información en formato JSON estricto: { \"name\": \"Nombre del producto\", \"category\": \"Electrónica, Herramientas, Ropa, Documentos, Muebles, Cocina, Deportes, Juguetes o Otros\", \"description\": \"Corta descripcion del uso o características\", \"tags\": [\"array\", \"de\", \"etiquetas\"], \"confidence\": 0.9 }" },
              { inline_data: { mime_type: mimeType, data: base64Data } }
            ]
          }],
          generationConfig: { temperature: 0.1 }
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
      
      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textResponse) throw new Error('Respuesta de Gemini vacía');
      
      return this.parseAIResponse(textResponse);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async analyzeWithGroq(imageDataUrl: string): Promise<AIAnalysisResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    
    try {
      const response = await fetch('/api/ai/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageDataUrl }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`Groq error: ${response.status}`);
      const data = await response.json();
      return this.parseAIResponse(data);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async basicImageAnalysis(imageDataUrl: string): Promise<AIAnalysisResult> {
    const filename = this.extractFilename(imageDataUrl);
    const commonObjects = [
      { pattern: /phone|celular|iphone/i, name: 'Teléfono', category: 'Electrónica' },
      { pattern: /laptop|computer|macbook/i, name: 'Computadora', category: 'Electrónica' },
      { pattern: /headphone|audifono|airpods/i, name: 'Audífonos', category: 'Electrónica' },
      { pattern: /book|libro/i, name: 'Libro', category: 'Documentos' },
    ];
    
    let detectedName = 'Objeto';
    let detectedCategory = 'Otros';
    for (const item of commonObjects) {
      if (item.pattern.test(filename)) {
        detectedName = item.name;
        detectedCategory = item.category;
        break;
      }
    }
    
    return {
      name: detectedName,
      category: detectedCategory,
      description: `Objeto detectado: ${detectedName}. Verifica la información.`,
      tags: [detectedCategory.toLowerCase()],
      confidence: 0.3,
      needsReview: true
    };
  }

  private parseAIResponse(data: any): AIAnalysisResult {
    let parsed: Partial<AIAnalysisResult> = {};
    if (data.name && data.category) parsed = data;
    else if (data.text || data.response) parsed = this.extractFromText(data.text || data.response);
    else if (typeof data === 'string') {
      try { parsed = JSON.parse(data); } catch { parsed = this.extractFromText(data); }
    }
    
    return {
      name: this.sanitizeString(parsed.name) || 'Objeto detectado',
      category: this.validateCategory(parsed.category),
      description: this.sanitizeString(parsed.description) || 'Descripción no disponible',
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
      needsReview: false
    };
  }

  private extractFromText(text: string): Partial<AIAnalysisResult> {
    let name = text.match(/nombre:?\s*([^\n]+)/i)?.[1].trim() || text.split('\n')[0].slice(0, 50);
    let category = this.validCategories.find(c => text.toLowerCase().includes(c.toLowerCase())) || 'Otros';
    let description = text.match(/descripción:?\s*([^\n]+)/i)?.[1].trim() || text.slice(0, 200);
    return { name, category, description };
  }

  private validateCategory(category: string | undefined): string {
    if (!category) return 'Otros';
    const normalized = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    return this.validCategories.includes(normalized) ? normalized : 'Otros';
  }

  private sanitizeString(str: string | undefined): string {
    if (!str) return '';
    return str.trim().replace(/[<>]/g, '').slice(0, 100);
  }

  private sanitizeResult(result: AIAnalysisResult): AIAnalysisResult {
    return {
      name: result.name || 'Objeto detectado',
      category: this.validateCategory(result.category),
      description: (result.description || 'Sin descripción').slice(0, 500),
      tags: (result.tags || []).slice(0, 5),
      confidence: Math.min(1, Math.max(0, result.confidence || 0)),
      needsReview: result.needsReview || result.confidence < 0.7
    };
  }

  private classifyError(error: any): AIError {
    const message = error.message?.toLowerCase() || '';
    if (message.includes('network') || message.includes('fetch')) return { type: 'network', message: 'Error de conexión', retryable: true };
    if (message.includes('timeout') || message.includes('abort')) return { type: 'timeout', message: 'Tiempo de espera agotado', retryable: true };
    if (message.includes('rate') || message.includes('quota')) return { type: 'rate_limit', message: 'Límite alcanzado', retryable: false };
    return { type: 'unknown', message: error.message || 'Error desconocido', retryable: true };
  }

  private isValidImageFormat(dataUrl: string): boolean {
    return ['image/jpeg', 'image/png', 'image/webp'].some(f => dataUrl.includes(f));
  }

  private extractFilename(dataUrl: string): string {
    return dataUrl.match(/filename=([^;]+)/)?.[1] || '';
  }

  private async hashImage(dataUrl: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(dataUrl.slice(0, 1000));
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}

export const robustAI = new RobustAIService();
