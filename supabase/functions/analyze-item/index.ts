// Importamos el servidor HTTP de Deno (estándar en Edge Functions)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Configuración de CORS para permitir que tu frontend en localhost se conecte
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Parser de JSON a prueba de balas.
 * Elimina bloques de markdown (```json ... ```) antes de parsear.
 * Funciona sin importar cómo el modelo formatee su respuesta.
 */
function parseAIResponse(textResponse: string): unknown {
  // Intento 1: JSON puro directo
  try { return JSON.parse(textResponse); } catch { /* continúa */ }

  // Intento 2: Extraer bloque ```json ... ``` o ``` ... ```
  const fenceMatch = textResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch?.[1]) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch { /* continúa */ }
  }

  // Intento 3 (más robusto): capturar el primer objeto/array JSON completo
  const jsonMatch = textResponse.match(/[\{\[][\s\S]*[\}\]]/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]); } catch { /* continúa */ }
  }

  throw new Error(`No se encontró JSON válido en la respuesta de la IA. Preview: "${textResponse.slice(0, 200)}"`);
}

serve(async (req) => {
  // Manejo de la petición OPTIONS (Preflight de CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Extraemos la imagen enviada desde el frontend
    const { image } = await req.json()
    if (!image) throw new Error("No se proporcionó ninguna imagen")

    // 2. API Key desde las variables de entorno del servidor
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('VITE_GEMINI_API_KEY')
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY no configurada en el entorno del servidor.")

    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const mimeType = image.includes(';') ? image.split(';')[0].split(':')[1] : "image/jpeg";

    // 3. Prompt actualizado — solicita accesorios, specs técnicas y estado
    const geminiPrompt = `Eres un experto analista de inventarios. Analiza la imagen y devuelve ÚNICAMENTE un objeto JSON estricto, sin bloques de markdown, sin texto adicional.

Instrucciones:
1. Identifica el objeto principal y cualquier accesorio visible (cables, adaptadores, bases, manuales, etc.).
2. Lee etiquetas y textos si es posible (ej. "12V 1.5A" en un cargador, marcas, modelos).
3. Si intuyes que al objeto le falta un accesorio crítico que no se ve en la foto (ej. un módem sin cable de corriente), añádelo con isIncluded: false.

Devuelve EXACTAMENTE esta estructura JSON:
{
  "name": "Nombre claro y específico del objeto principal",
  "category": "Una de: Electrónica, Herramientas, Ropa, Documentos, Muebles, Cocina, Deportes, Juguetes, Otros",
  "description": "Descripción breve del uso o características principales",
  "tags": ["etiqueta1", "etiqueta2"],
  "confidence": 0.9,
  "technical_specs": "Especificaciones técnicas visibles (ej. WiFi 6 Dual Band, 12V 2A) o null si no aplica",
  "condition": "Estado aparente: Buen estado / Desgastado / Requiere revisión / Desconocido",
  "accessories": [
    {
      "name": "Nombre del accesorio",
      "isIncluded": true,
      "details": "Especificaciones si son visibles, si no pon null"
    }
  ]
}`;

    const geminiPayload = {
      contents: [{
        parts: [
          { text: geminiPrompt },
          { inline_data: { mime_type: mimeType, data: base64Data } } 
        ]
      }],
      generationConfig: { 
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload)
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API Error: ${err}`);
    }

    const aiResult = await response.json();
    
    // 4. Parsear con el extractor a prueba de balas (maneja ```json``` y texto extra)
    const textResult = aiResult.candidates[0].content.parts[0].text;
    const parsedData = parseAIResponse(textResult);

    // 5. Devolvemos los datos al frontend
    return new Response(
      JSON.stringify(parsedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[AnalyzeItem Error]:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

