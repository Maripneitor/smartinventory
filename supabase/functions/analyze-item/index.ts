// supabase/functions/analyze-item/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function isRetryableStatus(status: number) {
  return status === 429 || (status >= 500 && status <= 599);
}

/** Decide si vale la pena hacer fallback al otro proveedor */
function shouldFallback(err: any) {
  const msg = String(err?.message ?? err ?? "");
  // auth / key inválida / permisos / cuota / rate limit / timeouts / server
  return (
    msg.includes("401") ||
    msg.includes("403") ||
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("rate") ||
    msg.toLowerCase().includes("timeout") ||
    msg.includes("5") || // cubre 5xx en mensaje
    msg.toLowerCase().includes("parse") // JSON no parseable
  );
}

async function fetchJsonWithTimeout(url: string, init: RequestInit, timeoutMs = 15000) {
  const ac = new AbortController();
  const id = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ac.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function geminiVisionJson(params: {
  apiKey: string;
  model: string;
  mimeType: string;
  base64Data: string;
}) {
  const { apiKey, model, mimeType, base64Data } = params;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const prompt = `
Analiza esta imagen de un objeto doméstico.
Devuélveme SOLO un JSON válido con:
nombre_corto, categoria, descripcion, color, tags (3-8), posible_dispositivo.
Si no estás seguro: usa null. No inventes marcas/modelos.
`.trim();

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: base64Data } },
        ],
      },
    ],
    generationConfig: {
      response_mime_type: "application/json",
      temperature: 0.2,
      max_output_tokens: 512,
    },
  };

  let lastErr: any = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetchJsonWithTimeout(
      url,
      {
        method: "POST",
        headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      15000
    );

    if (res.ok) {
      const data = await res.json();
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).join("") ??
        "";
      try {
        return JSON.parse(text);
      } catch {
        const m = String(text).match(/\{[\s\S]*\}/);
        if (m) return JSON.parse(m[0]);
        throw new Error("Gemini parse error: JSON no válido");
      }
    }

    const errText = await res.text().catch(() => "");
    lastErr = new Error(`Gemini error ${res.status}: ${errText}`);

    if (!isRetryableStatus(res.status)) break;
    await sleep(250 * Math.pow(2, attempt - 1));
  }

  throw lastErr ?? new Error("Gemini failed");
}

async function groqVisionJson(params: {
  apiKey: string;
  model: string;
  mimeType: string;
  base64Data: string;
}) {
  const { apiKey, model, mimeType, base64Data } = params;

  const url = "https://api.groq.com/openai/v1/chat/completions";
  const prompt = `
Analiza esta imagen de un objeto doméstico.
Devuélveme SOLO un JSON válido con:
nombre_corto, categoria, descripcion, color, tags (3-8), posible_dispositivo.
Si no estás seguro: usa null. No inventes marcas/modelos.
`.trim();

  const body = {
    model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64Data}` },
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_completion_tokens: 512,
  };

  let lastErr: any = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetchJsonWithTimeout(
      url,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      15000
    );

    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content ?? "";
      try {
        return JSON.parse(text);
      } catch {
        const m = String(text).match(/\{[\s\S]*\}/);
        if (m) return JSON.parse(m[0]);
        throw new Error("Groq parse error: JSON no válido");
      }
    }

    const errText = await res.text().catch(() => "");
    lastErr = new Error(`Groq error ${res.status}: ${errText}`);

    if (!isRetryableStatus(res.status)) break;
    await sleep(250 * Math.pow(2, attempt - 1));
  }

  throw lastErr ?? new Error("Groq failed");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
    const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.0-flash";

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";
    const GROQ_VISION_MODEL =
      Deno.env.get("GROQ_VISION_MODEL") ?? "llama-3.2-11b-vision-preview";

    const primary = (Deno.env.get("AI_PROVIDER_PRIMARY") ?? "gemini").toLowerCase();
    const fallback = (Deno.env.get("AI_PROVIDER_FALLBACK") ?? "groq").toLowerCase();

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing Authorization Bearer token" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    const user = userRes.user;

    const { photo_path, mime_type } = await req.json().catch(() => ({}));
    if (!photo_path || typeof photo_path !== "string") {
      return new Response(JSON.stringify({ error: "photo_path requerido" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    if (!photo_path.startsWith(`${user.id}/`)) {
      return new Response(JSON.stringify({ error: "Forbidden photo_path" }), {
        status: 403,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const { data: blob, error: dlErr } = await supabase.storage
      .from("item-photos")
      .download(photo_path);

    if (dlErr || !blob) {
      return new Response(JSON.stringify({ error: "No se pudo descargar la imagen" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const bytes = new Uint8Array(await blob.arrayBuffer());
    const base64Data = encodeBase64(bytes);
    const mimeType = (typeof mime_type === "string" && mime_type) ? mime_type : "image/jpeg";

    // --- Failover strategy ---
    const providers = [primary, fallback].filter(Boolean);
    let lastError: any = null;

    for (let i = 0; i < providers.length; i++) {
      const p = providers[i];

      try {
        if (p === "gemini") {
          if (!GEMINI_API_KEY) throw new Error("Gemini error 401: Missing GEMINI_API_KEY");
          const json = await geminiVisionJson({
            apiKey: GEMINI_API_KEY,
            model: GEMINI_MODEL,
            mimeType,
            base64Data,
          });
          return new Response(JSON.stringify({ ...json, _provider: "gemini" }), {
            status: 200,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          });
        }

        if (p === "groq") {
          if (!GROQ_API_KEY) throw new Error("Groq error 401: Missing GROQ_API_KEY");
          const json = await groqVisionJson({
            apiKey: GROQ_API_KEY,
            model: GROQ_VISION_MODEL,
            mimeType,
            base64Data,
          });
          return new Response(JSON.stringify({ ...json, _provider: "groq" }), {
            status: 200,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          });
        }

        throw new Error(`Proveedor IA no soportado: ${p}`);
      } catch (e: any) {
        lastError = e;
        if (!shouldFallback(e)) break;
      }
    }

    return new Response(JSON.stringify({ error: lastError?.message ?? "IA failed" }), {
      status: 502,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
