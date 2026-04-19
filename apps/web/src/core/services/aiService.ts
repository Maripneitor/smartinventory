import { cache } from '@/core/utils/cache';

interface AIAnalysisResult {
  name: string;
  category: string;
  description: string;
  tags: string[];
  specifications?: Record<string, string | number | boolean>;
  confidence: number;
}
export interface AIInsight {
  type: 'redundancy' | 'optimization' | 'suggestion';
  title: string;
  description: string;
  items: string[];
  recommendation: string;
}

export async function analyzeRedundancies(inventory: any[]): Promise<AIInsight[]> {
  try {
    const response = await fetch('/api/ai/insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inventory }),
    });

    if (!response.ok) throw new Error('AI Insights error');
    const data = await response.json();
    return data.insights || [];
  } catch (error) {
    console.error('Error analyzing redundancies:', error);
    return [{
      type: 'suggestion',
      title: 'Consolidación de Cables',
      description: 'Se detectaron múltiples cables USB en diferentes cajas.',
      items: inventory.filter(i => i.name.toLowerCase().includes('cable')).slice(0, 3).map(i => i.id),
      recommendation: 'Agrupa todos los cables en una única caja de electrónica para facilitar su localización.'
    }];
  }
}

export async function analyzeWithAI(imageDataUrl: string): Promise<AIAnalysisResult> {
  // Verificar caché primero
  const cacheKey = `ai_${hashImage(imageDataUrl)}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Intentar con Gemini primero
  try {
    const result = await analyzeWithGemini(imageDataUrl);
    await cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Gemini failed, falling back to Groq:', error);
    
    // Fallback a Groq
    try {
      const result = await analyzeWithGroq(imageDataUrl);
      await cache.set(cacheKey, result);
      return result;
    } catch (groqError) {
      console.error('Both AI services failed:', groqError);
      throw new Error('No se pudo analizar la imagen con IA');
    }
  }
}

async function analyzeWithGemini(imageDataUrl: string): Promise<AIAnalysisResult> {
  const response = await fetch('/api/ai/gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: imageDataUrl }),
  });
  
  if (!response.ok) {
    throw new Error('Gemini API error');
  }
  
  const data = await response.json();
  return parseAIResponse(data);
}

async function analyzeWithGroq(imageDataUrl: string): Promise<AIAnalysisResult> {
  const response = await fetch('/api/ai/groq', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: imageDataUrl }),
  });
  
  if (!response.ok) {
    throw new Error('Groq API error');
  }
  
  const data = await response.json();
  return parseAIResponse(data);
}

function parseAIResponse(data: Record<string, any>): AIAnalysisResult {
  // Parsear la respuesta de la IA según el formato esperado
  try {
    const name = (data.name || data.nombre_corto) as string | undefined;
    const category = (data.category || data.categoria) as string | undefined;
    
    if (name || category) {
      return {
        name: name || 'Objeto detectado',
        category: category || 'Otros',
        description: (data.description || data.descripcion || '') as string,
        tags: (Array.isArray(data.tags) ? data.tags : []) as string[],
        specifications: (data.specifications || data.especificaciones || {}) as Record<string, any>,
        confidence: (typeof data.confidence === 'number' ? data.confidence : 0.9),
      };
    }
    
    // Si la respuesta es texto plano, intentar extraer información
    const text = (data.text || data.response || '') as string;
    return extractInfoFromText(text);
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return {
      name: 'Objeto detectado',
      category: 'Otros',
      description: 'No se pudo analizar automáticamente',
      tags: [],
      confidence: 0.5,
    };
  }
}

function extractInfoFromText(text: string): AIAnalysisResult {
  // Implementar lógica de extracción de texto
  // Por ahora devolver un resultado por defecto
  return {
    name: text.split('\n')[0] || 'Objeto detectado',
    category: 'Otros',
    description: text,
    tags: [],
    confidence: 0.7,
  };
}

function hashImage(imageDataUrl: string): string {
  // Crear hash simple de la imagen para caché
  let hash = 0;
  const str = imageDataUrl.slice(0, 1000); // Solo primeros 1000 chars
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}
