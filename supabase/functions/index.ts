import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Router para emular Supabase Edge Functions localmente
serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname.replace("/", "");
  const functionName = path.split("/")[0];

  console.log(`[Router] Request for function: ${functionName}`);

  try {
    // Intentar importar y ejecutar la función solicitada
    // Nota: deno.land/edge-runtime usualmente maneja esto de otra forma, 
    // pero para este setup de Docker vamos a intentar importar dinámicamente
    const entryPoint = `./${functionName}/index.ts`;
    const { default: handler } = await import(entryPoint);
    
    return await handler(req);
  } catch (err) {
    console.error(`[Router] Error calling ${functionName}:`, err);
    return new Response(JSON.stringify({ error: `Function ${functionName} not found or failed.`, details: err.message }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
});
