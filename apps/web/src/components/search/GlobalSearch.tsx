"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, Package, Tag, Box, ArrowRight } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { itemsService } from "@/core/items";
import { type Item } from "@/entities/item/schema";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { SmartImage } from "@/components/shared/SmartImage";

export function GlobalSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<(Item & { containers: { label: string } })[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    
    const debouncedQuery = useDebounce(query, 300);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const controller = new AbortController();
        
        const performSearch = async () => {
            if (!debouncedQuery.trim()) {
                setResults([]);
                return;
            }
            setIsLoading(true);
            try {
                const searchResults = await itemsService.search(debouncedQuery, controller.signal);
                if (!controller.signal.aborted) {
                    setResults(searchResults);
                    setIsOpen(true);
                }
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    console.error("Search error:", error);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        performSearch();
        return () => controller.abort();
    }, [debouncedQuery]);

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={searchRef} className="relative w-full max-w-xl">
            <div className="relative group">
                <Search className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                    isOpen ? "text-primary" : "text-on-surface-variant/50"
                )} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.trim() && setIsOpen(true)}
                    placeholder="Buscar por nombre, tag o categoría..."
                    className="w-full h-12 pl-11 pr-11 bg-surface-container-low border border-outline-variant/10 rounded-2xl font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container transition-all"
                />
                {query && (
                    <button
                        onClick={() => { setQuery(""); setResults([]); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-surface-container-high rounded-full transition-colors"
                    >
                        <X className="h-3 w-3 text-on-surface-variant" />
                    </button>
                )}
            </div>

            <AnimatePresence>
                {isOpen && (results.length > 0 || isLoading) && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        className="absolute top-full mt-2 w-full bg-surface-container-lowest border border-outline-variant/10 rounded-[2rem] shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
                    >
                        {isLoading ? (
                            <div className="p-8 flex flex-col items-center gap-3">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">Buscando en inventario...</p>
                            </div>
                        ) : (
                            <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
                                {results.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/containers/${item.container_id}?item=${item.id}`}
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center gap-4 p-3 hover:bg-surface-container-high rounded-2xl transition-all group"
                                    >
                                        <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0 bg-surface-container-highest flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <SmartImage 
                                                path={item.photo_path} 
                                                alt={item.name} 
                                                className="w-full h-full object-cover"
                                                fallbackClassName="w-full h-full flex items-center justify-center text-on-surface-variant/30"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm text-on-surface truncate">{item.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest bg-surface-container-high px-2 py-0.5 rounded-md">
                                                    {item.containers.label}
                                                </span>
                                                {item.category && (
                                                    <span className="flex items-center gap-1 text-[10px] font-medium text-primary/60">
                                                        <Tag className="h-2.5 w-2.5" />
                                                        {item.category}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-on-surface-variant/20 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                    </Link>
                                ))}
                            </div>
                        )}
                        <div className="p-3 border-t border-outline-variant/5 bg-surface-container-low/50">
                            <p className="text-[9px] font-medium text-center text-on-surface-variant/40 uppercase tracking-widest">
                                Mostrando {results.length} coincidencias
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
