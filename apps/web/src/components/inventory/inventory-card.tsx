"use client";

import { Package as PackageIcon } from "lucide-react";
import { Item } from "@/core/items";
import { cn } from "@/lib/utils";

interface InventoryCardProps {
    item: Item;
    signedUrl?: string;
    className?: string;
}

import { Card } from "@/components/ui/card";

export function InventoryCard({ item, signedUrl, className }: InventoryCardProps) {
    return (
        <Card
            variant="glass"
            interactive
            noPadding
            className={cn("group flex flex-col gap-3 p-2", className)}
        >
            <div className="aspect-square w-full overflow-hidden rounded-2xl bg-sky-50 border border-sky-100 relative">
                {signedUrl ? (
                    <img
                        src={signedUrl}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        alt={item.name}
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-sky-200">
                        <PackageIcon className="h-10 w-10 opacity-50" />
                    </div>
                )}

                {item.item_type === 'device' && (
                    <div className="absolute left-2 top-2 rounded-lg bg-sky-600 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white shadow-lg shadow-sky-500/20">
                        Aparato
                    </div>
                )}

                {item.item_type === 'accessory' && (
                    <div className="absolute left-2 top-2 rounded-lg bg-emerald-100 border border-emerald-200 backdrop-blur-md px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-700">
                        Accesorio
                    </div>
                )}
            </div>

            <div className="px-2 pb-2">
                <h3 className="line-clamp-1 text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">{item.name}</h3>
                <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Cant: {item.quantity}
                    </span>
                    <span className={cn(
                        "rounded-md px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-tighter",
                        item.condition === 'new' ? "bg-emerald-100 text-emerald-700" :
                            item.condition === 'defective' ? "bg-red-100 text-red-700" :
                                "bg-sky-100 text-sky-700"
                    )}>
                        {item.condition === 'new' ? 'Nuevo' : item.condition === 'used' ? 'Usado' : 'Defecto'}
                    </span>
                </div>
            </div>
        </Card>
    );
}
