import { cache } from '@/core/utils/cache';

interface AIAnalysisResult {
  name: string;
  category: string;
  description: string;
  tags: string[];
  confidence: number;
}

export async function analyzeWithAI(imageDataUrl: string): Promise<AIAnalysisResult> {
  // Verificar caché primero
  const cacheKey = `ai_${hashImage(imageDataUrl)}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    console.log('Returning cached result');
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

function parseAIResponse(data: any): AIAnalysisResult {
  // Parsear la respuesta de la IA según el formato esperado
  try {
    // Si la respuesta ya está estructurada
    if (data.name && data.category) {
      return {
        name: data.name,
        category: data.category,
        description: data.description || '',
        tags: data.tags || [],
        confidence: data.confidence || 0.9,
      };
    }
    
    // Si la respuesta es texto plano, intentar extraer información
    const text = data.text || data.response || '';
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
