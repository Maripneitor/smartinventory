// supabase/functions/main/index.ts
// Router para funciones locales de Edge Runtime

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const functions: Record<string, string> = {
  "analyze-item": "../analyze-item/index.ts",
  "embed-text": "../embed-text/index.ts",
  "gemini-analyze": "../gemini-analyze/index.ts", 
  "generate-embedding": "../generate-embedding/index.ts",
  "groq-analyze": "../groq-analyze/index.ts",
};

serve(async (req) => {
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  
  // Esperamos /v1/:functionName o similar
  const functionName = pathParts[1] || pathParts[0];
  
  console.log(`[Router] Routing request for: ${functionName}`);
  
  if (functions[functionName]) {
    try {
      const module = await import(functions[functionName]);
      if (typeof module.default === 'function') {
          return await module.default(req);
      }
      // Si el modulo usa Deno.serve directamente (como analyze-item/index.ts)
      // esto es un problema porque no exporta la función.
      // Modificaremos las funciones para que exporten el handler.
      return new Response(`Function ${functionName} exists but handler not exported`, { status: 500 });
    } catch (e) {
      console.error(`Error loading function ${functionName}:`, e);
      return new Response(`Error loading function ${functionName}`, { status: 500 });
    }
  }

  return new Response("Function not found", { status: 404 });
});
