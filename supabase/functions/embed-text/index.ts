// supabase/functions/embed-text/index.ts
// Edge Function (Deno) — SmartInventory
//
// CONTRATO:
//   POST /functions/v1/embed-text
//   Headers: Authorization: Bearer <jwt>
//   Body (JSON):
//     {
//       "item_id": "uuid",
//       "text":    "nombre categoría descripción tags..."
//     }
//   Response: { "success": true, "dimensions": 768 }
//
// Genera embedding con Gemini text-embedding-004 y lo guarda en items.embedding.
// Se llama al crear/editar un item (desde el cliente o tras analyze-item).

import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        });
    }

    if (req.method !== "POST") {
        return jsonResp(405, { error: "Method Not Allowed" });
    }

    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return jsonResp(401, { error: "Missing Authorization" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return jsonResp(401, { error: "Unauthorized" });

    // ── Parsear body ──────────────────────────────────────────────────────────
    let body: { item_id: string; text: string };
    try {
        body = await req.json();
    } catch {
        return jsonResp(400, { error: "Invalid JSON body" });
    }

    const { item_id, text } = body;
    if (!item_id || !text) {
        return jsonResp(400, { error: "item_id y text son requeridos" });
    }

    // ── Generar embedding con Gemini ──────────────────────────────────────────
    // Modelo: text-embedding-004 (dimensión = 768, gratis en Gemini API)
    const embedUrl =
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiApiKey}`;

    const embedRes = await fetch(embedUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "models/text-embedding-004",
            content: { parts: [{ text: text.slice(0, 2000) }] }, // limitar tokens
            taskType: "RETRIEVAL_DOCUMENT",
        }),
    });

    if (!embedRes.ok) {
        const err = await embedRes.text();
        return jsonResp(502, { error: `Gemini embed error: ${err}` });
    }

    const embedData = await embedRes.json() as {
        embedding?: { values?: number[] };
    };
    const vector = embedData.embedding?.values;
    if (!vector || vector.length === 0) {
        return jsonResp(502, { error: "Embedding vacío de Gemini" });
    }

    // ── Guardar embedding en DB ───────────────────────────────────────────────
    const serviceClient = createClient(supabaseUrl, serviceKey);
    const { error: updateError } = await serviceClient
        .from("items")
        .update({ embedding: vector })
        .eq("id", item_id)
        .eq("user_id", user.id); // seguridad extra

    if (updateError) {
        return jsonResp(500, { error: `DB update error: ${updateError.message}` });
    }

    return jsonResp(200, { success: true, dimensions: vector.length });
});

function jsonResp(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
    });
}
