import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.1.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const { image } = await req.json();
    
    // Inicializar Gemini
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }); // Actualizado a Flash 2.0 para mayor velocidad y calidad
    
    // Preparar la imagen
    const base64Data = image.split(',')[1];
    const imageData = base64Data;
    
    // Prompt para el análisis
    const prompt = `
      Analiza esta imagen de un objeto y proporciona la siguiente información en formato JSON:
      - name: Nombre del objeto (en español)
      - category: Categoría (Electrónica, Herramientas, Ropa, Documentos, Otros)
      - description: Descripción detallada del objeto (en español)
      - tags: Array de 3-5 etiquetas relevantes
      - specifications: Objeto JSON con detalles técnicos detectados (ej: marca, modelo, dimensiones, material, voltaje, etc.)
      - confidence: Nivel de confianza del análisis (0-1)
      
      Responde SOLO con el JSON, sin texto adicional ni bloques de código.
    `;
    
    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: 'image/jpeg', data: imageData } }
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    // Limpiar respuesta por si incluye ```json ... ```
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const analysis = JSON.parse(cleanJson);
    
    return new Response(
      JSON.stringify(analysis),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});
