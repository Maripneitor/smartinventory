"use client";

import { useState, useTransition } from "react";
import { Search as SearchIcon, ChevronLeft, Sparkles, Loader2, Package, MapPin, Zap } from "lucide-react";
import Link from "next/link";
import { hybridSearch, textSearch } from "@/lib/data/ai";
import { createSignedPhotoUrl } from "@/lib/data/storage";
import { cn } from "@/lib/utils";

type SearchMode = "hybrid" | "text";

type SearchResult = {
    id: string;
    name: string;
    category: string | null;
    description: string | null;
    photo_path: string | null;
    container_id: string;
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
                data = await hybridSearch(q);
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
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400"
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
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-500 disabled:opacity-30"
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
                        "flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all",
                        mode === "hybrid"
                            ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                            : "bg-zinc-900 text-zinc-500 border border-white/5"
                    )}
                    aria-label={`Modo de búsqueda: ${mode === "hybrid" ? "Híbrida (IA + Texto)" : "Solo Texto"}`}
                >
                    {mode === "hybrid"
                        ? <><Sparkles className="h-3 w-3" /> Híbrida (IA + Texto)</>
                        : <><Zap className="h-3 w-3" /> Solo Texto</>
                    }
                </button>
                <span className="text-[10px] text-zinc-600">
                    {mode === "hybrid"
                        ? "Busca por significado, no solo palabras exactas"
                        : "Búsqueda rápida por palabras clave"
                    }
                </span>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
                    {error}
                </div>
            )}

            {/* Results */}
            <div className="flex flex-col gap-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 px-1">
                    {isPending
                        ? "Buscando..."
                        : results.length > 0
                            ? `${results.length} resultado${results.length !== 1 ? "s" : ""}`
                            : query
                                ? "Sin resultados — intenta con otras palabras"
                                : "Escribe algo para buscar"
                    }
                </h2>

                <div className="grid grid-cols-1 gap-4" role="list" aria-label="Resultados de búsqueda">
                    {results.map((item) => (
                        <Link
                            key={item.id}
                            href={`/containers/${item.container_id}`}
                            className="glass-card group flex items-center gap-4 p-3 hover:bg-white/5 transition-all active:scale-[0.98]"
                            role="listitem"
                        >
                            <div className="h-20 w-20 overflow-hidden rounded-xl bg-zinc-900 flex-shrink-0">
                                {item.photo_path && signedUrls[item.id] ? (
                                    <img
                                        src={signedUrls[item.id]}
                                        className="h-full w-full object-cover"
                                        alt={item.name}
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-zinc-800">
                                        <Package className="h-8 w-8 opacity-20" />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-1 flex-col gap-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-zinc-100 truncate">{item.name}</h3>
                                    {/* Score badge: muestra el tipo de match */}
                                    {mode === "hybrid" ? (
                                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                            {item.score_text > 0 && (
                                                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                                                    TXT
                                                </span>
                                            )}
                                            {item.score_semantic > 0.3 && (
                                                <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                                                    IA
                                                </span>
                                            )}
                                            <span className="text-[9px] font-bold text-zinc-500">
                                                {Math.round(item.score_combined * 100)}%
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full ml-2">
                                            TXT
                                        </span>
                                    )}
                                </div>
                                <p className="line-clamp-1 text-xs text-zinc-500">{item.description || "Sin descripción"}</p>
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-1 text-[10px] text-zinc-600 font-medium">
                                        <MapPin className="h-3 w-3" /> Ver caja
                                    </div>
                                    {item.category && (
                                        <span className="text-[10px] text-zinc-700 font-bold uppercase tracking-tight">
                                            {item.category}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}

                    {!isPending && query && results.length === 0 && (
                        <div className="py-20 text-center flex flex-col items-center gap-3">
                            <div className="h-16 w-16 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5">
                                <SearchIcon className="h-8 w-8 text-zinc-700" />
                            </div>
                            <p className="text-zinc-500 text-sm italic">
                                No encontramos nada que coincida con &quot;{query}&quot;.
                            </p>
                            {mode === "hybrid" && (
                                <button
                                    onClick={toggleMode}
                                    className="text-xs text-blue-500 underline mt-1"
                                >
                                    Intentar solo con texto
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
