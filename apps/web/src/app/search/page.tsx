"use client";

import { useState, useTransition } from "react";
import { Search as SearchIcon, ChevronLeft, Sparkles, Loader2, Zap } from "lucide-react";
import Link from "next/link";
import { hybridSearch, textSearch } from "@/core/ai";
import { createSignedPhotoUrl } from "@/core/storage";
import { cn } from "@/lib/utils";
import { InventoryCard } from "@/components/inventory/inventory-card";
import { Item } from "@/core/items";

type SearchMode = "hybrid" | "text";

type SearchResult = Item & {
    score_text: number;
    score_semantic: number;
    score_combined: number;
};

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [mode, setMode] = useState<SearchMode>("hybrid");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    async function runSearch(q: string, searchMode: SearchMode) {
        if (!q.trim()) return;
        setError(null);

        try {
            let data: SearchResult[];

            if (searchMode === "hybrid") {
                data = await hybridSearch(q) as SearchResult[];
            } else {
                data = await textSearch(q) as SearchResult[];
            }

            setResults(data);

            // Firmar URLs de fotos en batch
            const urls: Record<string, string> = {};
            await Promise.allSettled(
                data
                    .filter(item => item.photo_path)
                    .map(async (item) => {
                        try {
                            urls[item.id] = await createSignedPhotoUrl(item.photo_path!);
                        } catch { /* foto no disponible */ }
                    })
            );
            setSignedUrls(urls);
        } catch (e: any) {
            console.error(e);
            setError(e?.message ?? "Error en la búsqueda. Intenta de nuevo.");
        }
    }

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        startTransition(() => {
            runSearch(query, mode);
        });
    }

    function toggleMode() {
        const next: SearchMode = mode === "hybrid" ? "text" : "hybrid";
        setMode(next);
        if (query.trim()) runSearch(query, next);
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 active:scale-95 transition-all"
                    aria-label="Volver"
                >
                    <ChevronLeft className="h-6 w-6" />
                </Link>

                <form onSubmit={handleSearch} className="relative flex-1" role="search">
                    <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                    <input
                        id="search-input"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="¿Qué estás buscando? (ej: cables de video)"
                        className="h-12 w-full rounded-2xl border border-white/5 bg-zinc-900 pl-12 pr-24 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
                        autoFocus
                        aria-label="Campo de búsqueda"
                    />
                    <button
                        type="submit"
                        id="search-submit"
                        disabled={isPending}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-500 disabled:opacity-30 active:scale-90 transition-transform"
                        aria-label="Buscar"
                    >
                        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                    </button>
                </form>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center gap-2">
                <button
                    onClick={toggleMode}
                    className={cn(
                        "flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all",
                        mode === "hybrid"
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                            : "bg-zinc-900 text-zinc-500 border border-white/5"
                    )}
                    aria-label={`Modo de búsqueda: ${mode === "hybrid" ? "Híbrida (IA + Texto)" : "Solo Texto"}`}
                >
                    {mode === "hybrid"
                        ? <><Sparkles className="h-3 w-3" /> Híbrida</>
                        : <><Zap className="h-3 w-3" /> Clásica</>
                    }
                </button>
                <span className="text-[10px] text-zinc-600 font-medium">
                    {mode === "hybrid"
                        ? "Búsqueda semántica con IA"
                        : "Búsqueda por palabras exactas"
                    }
                </span>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-100">
                    {error}
                </div>
            )}

            {/* Results */}
            <div className="flex flex-col gap-4">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 px-1">
                    {isPending
                        ? "Buscando..."
                        : results.length > 0
                            ? `${results.length} resultado${results.length !== 1 ? "s" : ""}`
                            : query
                                ? "Sin resultados"
                                : "Tu Inventario"
                    }
                </h2>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" role="list">
                    {results.map((item) => (
                        <Link 
                            key={item.id} 
                            href={`/containers/${item.container_id}`}
                            className="active:scale-[0.98] transition-transform"
                        >
                            <InventoryCard 
                                item={item} 
                                signedUrl={signedUrls[item.id]} 
                            />
                            {/* Score info floating overlay for development/power users if needed */}
                            {mode === "hybrid" && (
                                <div className="mt-1 px-2 flex justify-end">
                                    <span className="text-[8px] font-mono text-zinc-700">
                                        Match: {Math.round(item.score_combined * 100)}%
                                    </span>
                                </div>
                            )}
                        </Link>
                    ))}
                </div>

                {!isPending && query && results.length === 0 && (
                    <div className="py-20 text-center flex flex-col items-center gap-4">
                        <div className="h-20 w-20 rounded-full bg-zinc-950 flex items-center justify-center border border-white/5">
                            <SearchIcon className="h-8 w-8 text-zinc-800" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-zinc-500 text-sm font-medium">
                                No encontramos nada que coincida con &quot;{query}&quot;
                            </p>
                            <p className="text-zinc-700 text-xs">
                                Intenta con términos más generales.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

