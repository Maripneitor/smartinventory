// supabase/functions/generate-embedding/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

    try {
        const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
        const { text } = await req.json().catch(() => ({}));

        if (!text || typeof text !== "string") {
            return new Response(JSON.stringify({ error: "text requerido" }), {
                status: 400,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            });
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "models/text-embedding-004",
                content: { parts: [{ text: text.slice(0, 2000) }] },
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            return new Response(JSON.stringify({ error: `Gemini error: ${err}` }), {
                status: 502,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            });
        }

        const data = await res.json();
        const vector = data.embedding?.values;

        return new Response(JSON.stringify({ embedding: vector }), {
            status: 200,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), {
            status: 500,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    }
});
