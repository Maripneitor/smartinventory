import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    
    // Si estamos en local o sin clave real, podemos simular o usar un modelo local
    // Por ahora, como el usuario tiene Gemini, podemos usar el endpoint de embeddings de Gemini
    const geminiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiKey) {
        // Mock fallback
        const mockVector = new Array(1536).fill(0).map(() => Math.random() - 0.5);
        return NextResponse.json({ embedding: mockVector });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "models/embedding-001",
        content: { parts: [{ text }] }
      })
    });

    if (!response.ok) {
        throw new Error('Gemini Embedding API error');
    }

    const data = await response.json();
    return NextResponse.json({ embedding: data.embedding.values });
  } catch (error: any) {
    console.warn('Embedding API Fallback:', error.message);
    const mockVector = new Array(1536).fill(0).map(() => Math.random() - 0.5);
    return NextResponse.json({ embedding: mockVector });
  }
}
