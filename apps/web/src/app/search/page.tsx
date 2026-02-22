"use client";

import { useState } from "react";
import { Search as SearchIcon, ChevronLeft, Sparkles, Loader2, Package, MapPin } from "lucide-react";
import Link from "next/link";
import { semanticSearch } from "@/lib/data/ai";
import { createSignedPhotoUrl } from "@/lib/data/storage";
import { cn } from "@/lib/utils";

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const data = await semanticSearch(query);
            setResults(data);

            // Cargar signed URLs
            const urls: Record<string, string> = {};
            await Promise.all(data.map(async (item: any) => {
                if (item.photo_path) {
                    try {
                        urls[item.id] = await createSignedPhotoUrl(item.photo_path);
                    } catch (e) {
                        console.error(e);
                    }
                }
            }));
            setSignedUrls(urls);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Search Header */}
            <div className="flex items-center gap-4">
                <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400">
                    <ChevronLeft className="h-6 w-6" />
                </Link>
                <form onSubmit={handleSearch} className="relative flex-1">
                    <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="¿Qué estás buscando? (ej: cables de video)"
                        className="h-12 w-full rounded-2xl border border-white/5 bg-zinc-900 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-500 disabled:opacity-30"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                    </button>
                </form>
            </div>

            {/* Results */}
            <div className="flex flex-col gap-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 px-1">
                    {loading ? "Buscando..." : results.length > 0 ? "Resultados de búsqueda inteligente" : "Escribe algo para buscar"}
                </h2>

                <div className="grid grid-cols-1 gap-4">
                    {results.map((item) => (
                        <Link
                            key={item.id}
                            href={`/containers/${item.container_id}`}
                            className="glass-card group flex items-center gap-4 p-3 hover:bg-white/5 transition-all active:scale-[0.98]"
                        >
                            <div className="h-20 w-20 overflow-hidden rounded-xl bg-zinc-900 flex-shrink-0">
                                {item.photo_path && signedUrls[item.id] ? (
                                    <img src={signedUrls[item.id]} className="h-full w-full object-cover" alt={item.name} />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-zinc-800">
                                        <Package className="h-8 w-8 opacity-20" />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-1 flex-col gap-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-zinc-100 truncate">{item.name}</h3>
                                    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                                        {Math.round(item.similarity * 100)}%
                                    </span>
                                </div>
                                <p className="line-clamp-1 text-xs text-zinc-500">{item.description || "Sin descripción"}</p>
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-1 text-[10px] text-zinc-600 font-medium">
                                        <MapPin className="h-3 w-3" /> Ver caja
                                    </div>
                                    <span className="text-[10px] text-zinc-700 font-bold uppercase tracking-tight">
                                        {item.category || "General"}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}

                    {!loading && query && results.length === 0 && (
                        <div className="py-20 text-center flex flex-col items-center gap-3">
                            <div className="h-16 w-16 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5">
                                <SearchIcon className="h-8 w-8 text-zinc-700" />
                            </div>
                            <p className="text-zinc-500 text-sm italic">No encontramos nada que coincida con "{query}".</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
