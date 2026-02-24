"use client";

import { Package as PackageIcon } from "lucide-react";
import { Item } from "@/core/items";
import { cn } from "@/lib/utils";

interface InventoryCardProps {
    item: Item;
    signedUrl?: string;
    className?: string;
}

export function InventoryCard({ item, signedUrl, className }: InventoryCardProps) {
    return (
        <div className={cn("glass-card group relative flex flex-col gap-3 p-2 transition-all hover:bg-white/2", className)}>
            <div className="aspect-square w-full overflow-hidden rounded-2xl bg-zinc-950 border border-white/5 relative">
                {signedUrl ? (
                    <img 
                        src={signedUrl} 
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        alt={item.name} 
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-800">
                        <PackageIcon className="h-10 w-10 opacity-20" />
                    </div>
                )}

                {item.item_type === 'device' && (
                    <div className="absolute left-2 top-2 rounded-lg bg-blue-600 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-500/20">
                        Aparato
                    </div>
                )}

                {item.item_type === 'accessory' && (
                    <div className="absolute left-2 top-2 rounded-lg bg-emerald-600/20 border border-emerald-500/20 backdrop-blur-md px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-400">
                        Accesorio
                    </div>
                )}
            </div>

            <div className="px-2 pb-2">
                <h3 className="line-clamp-1 text-sm font-bold text-zinc-100">{item.name}</h3>
                <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        Cant: {item.quantity}
                    </span>
                    <span className={cn(
                        "rounded-md px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-tighter",
                        item.condition === 'new' ? "bg-emerald-500/10 text-emerald-500" : 
                        item.condition === 'defective' ? "bg-red-500/10 text-red-500" : 
                        "bg-zinc-900 text-zinc-400"
                    )}>
                        {item.condition === 'new' ? 'Nuevo' : item.condition === 'used' ? 'Usado' : 'Defecto'}
                    </span>
                </div>
            </div>
        </div>
    );
}
