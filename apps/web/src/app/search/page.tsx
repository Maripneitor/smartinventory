"use client";

import { useState, useTransition } from "react";
import { Search as SearchIcon, ChevronLeft, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { hybridSearch, textSearch } from "@/core/ai";
import { createSignedPhotoUrl } from "@/core/storage";
import { cn } from "@/lib/utils";
import { InventoryCard } from "@/components/inventory/inventory-card";
import { Item } from "@/core/items";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Card } from "@/components/ui/card";

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

    return (
        <div className="flex flex-col gap-8 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 sticky top-0 z-20 bg-background/80 backdrop-blur-xl py-4 -mx-4 px-4 border-b border-white/5">
                <Link
                    href="/"
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-400 active:scale-95 transition-all hover:bg-zinc-800 border border-white/5"
                    aria-label="Volver"
                >
                    <ChevronLeft className="h-6 w-6" />
                </Link>

                <form onSubmit={handleSearch} className="relative flex-1" role="search">
                    <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                        id="search-input"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="¿Qué estás buscando? (ej: cables de video)"
                        className="pl-12 pr-12 h-14 bg-zinc-950/50 rounded-[1.5rem]"
                        autoFocus
                        aria-label="Campo de búsqueda"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        {isPending ? (
                            <div className="p-2"><Spinner size="sm" /></div>
                        ) : (
                            <Button
                                type="submit"
                                variant="ghost"
                                className="h-10 w-10 p-0 rounded-xl text-blue-500 hover:bg-blue-500/10"
                            >
                                <Sparkles className="h-5 w-5" />
                            </Button>
                        )}
                    </div>
                </form>
            </div>

            {/* Mode Toggle */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Motor de Búsqueda</h2>
                    <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-md border border-white/5">
                        {mode === "hybrid" ? "IA + Palabras Clave" : "Coincidencia Exacta"}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-3 p-1 bg-zinc-950 rounded-[1.5rem] border border-white/5">
                    <button
                        onClick={() => setMode("hybrid")}
                        className={cn(
                            "flex items-center justify-center gap-2 rounded-[1.25rem] py-3 text-[11px] font-black uppercase tracking-widest transition-all",
                            mode === "hybrid"
                                ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20"
                                : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        <Sparkles className="h-3.5 w-3.5" /> Híbrida (IA)
                    </button>
                    <button
                        onClick={() => setMode("text")}
                        className={cn(
                            "flex items-center justify-center gap-2 rounded-[1.25rem] py-3 text-[11px] font-black uppercase tracking-widest transition-all",
                            mode === "text"
                                ? "bg-zinc-800 text-white border border-white/10 shadow-xl"
                                : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        <Zap className="h-3.5 w-3.5" /> Clásica
                    </button>
                </div>
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
