import { createClient } from "@/lib/supabase/browser";

/**
 * Motor de IA unificado. 
 * Detecta si estamos en desarrollo para usar la API local.
 */
export async function analyzeItemWithAI(params: { photo_path: string; mime_type?: string }) {
    const isMockMode = process.env.AI_MODE === 'mock' || process.env.NEXT_PUBLIC_AI_MODE === 'mock';

    if (isMockMode) {
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
    const isMockMode = process.env.AI_MODE === 'mock' || process.env.NEXT_PUBLIC_AI_MODE === 'mock';

    if (isMockMode) {
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
    const isMockMode = process.env.AI_MODE === 'mock' || process.env.NEXT_PUBLIC_AI_MODE === 'mock';

    if (isMockMode) {
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

/**
 * Búsqueda híbrida: texto full-text + semántica (pgvector).
 * Usa la RPC hybrid_search de la DB que combina ambos scores.
 * Score = 0.4 * text_rank + 0.6 * semantic_similarity.
 */
export async function hybridSearch(query: string) {
    const supabase = createClient();
    const vector = await getQueryEmbedding(query);

    const { data, error } = await supabase.rpc("hybrid_search", {
        search_query: query,
        query_embedding: vector,
        match_threshold: 0.25,
        match_count: 20,
    });

    if (error) throw error;
    return data as Array<{
        id: string;
        name: string;
        category: string | null;
        description: string | null;
        photo_path: string | null;
        container_id: string;
        item_type: string;
        condition: string;
        quantity: number;
        tags: string[];
        score_text: number;
        score_semantic: number;
        score_combined: number;
    }>;
}

/**
 * Búsqueda solo por texto (rápida, sin embedding).
 * útil cuando no hay vectors generados o se quiere resultados instantáneos.
 */
export async function textSearch(query: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('items')
        .select('id, name, category, description, photo_path, container_id, item_type, condition, quantity, tags')
        .textSearch('search_tsv', query, { type: 'websearch', config: 'spanish' })
        .limit(20);

    if (error) throw error;
    return (data ?? []).map(item => ({
        ...item,
        score_text: 1,
        score_semantic: 0,
        score_combined: 0.4,
    }));
}
