"use client";

import { Package as PackageIcon } from "lucide-react";
import { Item } from "@/core/items";
import { cn } from "@/lib/utils";
import { LabelDownloader } from "./label-downloader";

interface InventoryCardProps {
    item: Item;
    signedUrl?: string;
    className?: string;
}

import { useLoanStore } from "@/core/stores/loanStore";
import { ShoppingCart, Check } from "lucide-react";
import { SmartImage } from "@/components/shared/SmartImage";
import { Card } from "@/components/ui/card";

export function InventoryCard({ item, signedUrl, className }: InventoryCardProps) {
    const { addItem, items: cartItems } = useLoanStore();
    const isInCart = cartItems.some(i => i.id === item.id);

    return (
        <Card
            variant="glass"
            interactive
            noPadding
            className={cn("group flex flex-col gap-3 p-2", className)}
        >
            <div className="aspect-square w-full overflow-hidden rounded-2xl bg-sky-50 border border-sky-100 relative">
                <SmartImage 
                    path={item.photo_path} 
                    alt={item.name} 
                    className="h-full w-full transition-transform duration-500 group-hover:scale-110"
                    fallbackClassName="flex h-full w-full items-center justify-center text-sky-200"
                />

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

                <div className="absolute right-2 top-2 flex flex-col gap-2 transition-opacity">
                    <LabelDownloader 
                        item={{
                            name: item.name,
                            category: item.category,
                            serial_number: item.serial_number ?? null
                        }} 
                        variant="icon" 
                    />
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addItem(item as any);
                        }}
                        disabled={isInCart}
                        className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                            isInCart 
                                ? "bg-emerald-500 text-white" 
                                : "bg-white/90 text-sky-600 hover:bg-sky-600 hover:text-white shadow-sm"
                        )}
                    >
                        {isInCart ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                    </button>
                </div>
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
