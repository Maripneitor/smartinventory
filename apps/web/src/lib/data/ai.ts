import { createClient } from "@/lib/supabase/browser";

/**
 * Motor de IA unificado. 
 * Detecta si estamos en desarrollo para usar la API local.
 */
export async function analyzeItemWithAI(params: { photo_path: string; mime_type?: string }) {
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
        try {
            const res = await fetch('/api/ai?function=analyze-item', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
            if (res.ok) return await res.json();
        } catch (e) {
            console.error("Fallback to supabase function after local AI error", e);
        }
    }

    const supabase = createClient();
    const { data, error } = await supabase.functions.invoke("analyze-item", {
        body: params,
    });

    if (error) throw error;
    return data;
}

export async function generateEmbeddings(params: { item_id: string; text: string }) {
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
        try {
            const res = await fetch('/api/ai?function=embed-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
            if (res.ok) return await res.json();
        } catch (e) { }
    }

    const supabase = createClient();
    const { data, error } = await supabase.functions.invoke("embed-text", {
        body: params,
    });
    if (error) throw error;
    return data;
}

export async function getQueryEmbedding(text: string) {
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
        try {
            const res = await fetch('/api/ai?function=generate-embedding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            if (res.ok) {
                const data = await res.json();
                return data.embedding;
            }
        } catch (e) { }
    }

    const supabase = createClient();
    const { data, error } = await supabase.functions.invoke("generate-embedding", {
        body: { text },
    });
    if (error) throw error;
    return data.embedding as number[];
}

export async function semanticSearch(query: string) {
    const supabase = createClient();
    const vector = await getQueryEmbedding(query);

    const { data, error } = await supabase.rpc("match_items", {
        query_embedding: vector,
        match_threshold: 0.35,
        match_count: 10,
    });

    if (error) throw error;
    return data;
}
