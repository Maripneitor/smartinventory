"use client";

import { useState, useEffect } from "react";
import { Search, Plus, X, Box, Link as LinkIcon } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { itemsService } from "@/core/items";
import { type Item } from "@/entities/item/schema";
import { cn } from "@/lib/utils";

interface RelatedItemsSelectorProps {
    value: string[];
    onChange: (ids: string[]) => void;
}

export function RelatedItemsSelector({ value, onChange }: RelatedItemsSelectorProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Item[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Item[]>([]);
    
    const debouncedQuery = useDebounce(query, 300);

    useEffect(() => {
        const fetchRelated = async () => {
            if (!debouncedQuery.trim()) {
                setResults([]);
                return;
            }
            setIsLoading(true);
            try {
                const res = await itemsService.search(debouncedQuery);
                // Filter out already selected
                setResults(res.filter(r => !value.includes(r.id)));
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRelated();
    }, [debouncedQuery, value]);

    // Load initial names for display
    useEffect(() => {
        const loadInitial = async () => {
            if (value.length > 0 && selectedItems.length === 0) {
                // This is a bit simplified, ideally we'd have a getItemsByIds
                const all = await itemsService.getAll();
                setSelectedItems(all.filter(i => value.includes(i.id)));
            }
        };
        loadInitial();
    }, [value]);

    const addItem = (item: Item) => {
        onChange([...value, item.id]);
        setSelectedItems([...selectedItems, item]);
        setQuery("");
        setResults([]);
    };

    const removeItem = (id: string) => {
        onChange(value.filter(v => v !== id));
        setSelectedItems(selectedItems.filter(i => i.id !== id));
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
                {selectedItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 pl-3 pr-1 py-1 rounded-xl">
                        <LinkIcon className="h-3 w-3 text-blue-400" />
                        <span className="text-xs font-bold text-white truncate max-w-[120px]">{item.name}</span>
                        <button 
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-1 hover:text-red-500 transition-colors"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Vincular con otro objeto (Ej. Cargador)..."
                    className="w-full h-10 pl-10 pr-4 bg-zinc-950 border border-white/5 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500/50 transition-all"
                />

                {results.length > 0 && (
                    <div className="absolute top-full mt-1 w-full bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-10 max-h-40 overflow-y-auto">
                        {results.map(item => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => addItem(item)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-white/5 text-left transition-colors border-b border-white/5 last:border-0"
                            >
                                <Box className="h-4 w-4 text-zinc-500" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-white truncate">{item.name}</p>
                                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest">{item.category || "General"}</p>
                                </div>
                                <Plus className="h-3.5 w-3.5 text-blue-500" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
