import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("VITE_GEMINI_API_KEY no encontrada");
  process.exit(1);
}

// URL for testing (Image of wireless earbuds similar to the one provided by the user)
const testImageUrl = "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=300&auto=format&fit=crop"; 

async function testGemini() {
  try {
    console.log("Descargando imagen de prueba...");
    const imageRes = await fetch(testImageUrl);
    const arrayBuffer = await imageRes.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = 'image/jpeg';
    
    console.log("✅ Imagen convertida a base64. Enviando a Gemini...");

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
      })
    });
    const dataResponse = await response.json();
    console.log("Respuesta:", JSON.stringify(dataResponse, null, 2));
  } catch(e) { console.error(e); }
}

testGemini();
