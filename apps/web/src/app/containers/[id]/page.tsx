"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, Plus, LayoutGrid, List as ListIcon, Info, Loader2, Package as PackageIcon, MapPin, AlertTriangle } from "lucide-react";
import NextLink from "next/link";
import { cn } from "@/lib/utils";
import { type Container } from "@/entities/container/schema";
import { type Item } from "@/entities/item/schema";
import { containersService } from "@/core/containers";
import { itemsService } from "@/core/items";
import { createSignedPhotoUrl } from "@/core/storage";
import { ContainerLabelPrinter } from "@/components/inventory/container-label-printer";
import { InventoryCard } from "@/components/inventory/inventory-card";

type ContainerWithLocation = Container & { locations?: { name?: string } | null };


export default function ContainerDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const [container, setContainer] = useState<ContainerWithLocation | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

    useEffect(() => {
        async function loadData() {
            try {
                const [cData, iData] = await Promise.all([
                    containersService.getById(id),
                    itemsService.getByContainer(id)
                ]);
                setContainer(cData);
                setItems(iData);

                // Cargar signed URLs para las fotos
                const urls: Record<string, string> = {};
                await Promise.all(iData.map(async (item) => {
                    if (item.photo_path) {
                        try {
                            urls[item.id] = await createSignedPhotoUrl(item.photo_path);
                        } catch (e) {
                            console.error("Error signing URL", e);
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
        loadData();
    }, [id]);

    if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;
    if (!container) return <div className="text-center py-20 text-zinc-500">Caja no encontrada.</div>;

    const isFull = items.length >= (container.max_items || 50);
    const capacityPercent = Math.min(100, (items.length / (container.max_items || 50)) * 100);

    return (
        <div className="flex flex-col gap-6">
            {/* Navbar Superior - Muy minimalista */}
            <div className="flex items-center justify-between">
                <NextLink href="/" className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 active:scale-95 transition-all">
                    <ChevronLeft className="h-6 w-6" />
                </NextLink>

                <div className="flex items-center gap-2">
                    <ContainerLabelPrinter containerId={container.id} label={container.label} />
                    <div className="h-10 px-3 flex flex-col justify-center rounded-xl bg-zinc-900 border border-white/5 min-w-[100px]">
                        <div className="flex justify-between items-center gap-2 mb-1">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">Capacidad</span>
                            <span className={cn("text-[8px] font-bold uppercase", isFull ? "text-red-400" : "text-zinc-400")}>
                                {items.length}/{container.max_items || 50}
                            </span>
                        </div>
                        <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className={cn("h-full transition-all duration-500", isFull ? "bg-red-500" : capacityPercent > 80 ? "bg-yellow-500" : "bg-blue-500")}
                                style={{ width: `${capacityPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerta de Capacidad */}
            {isFull && (
                <div className="flex items-center gap-4 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-500">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-red-400 uppercase tracking-tight">¡Caja Llena!</h4>
                        <p className="text-xs text-red-400/70">Has alcanzado el límite de {container.max_items} objetos. Considera usar otra caja o aumentar el límite de ésta.</p>
                    </div>
                </div>
            )}

            {/* Header Principal - Jerarquía Clara */}
            <header className="flex flex-col gap-1 mt-4">
                <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-blue-500/80">
                    <MapPin className="h-3 w-3" />
                    {container.locations?.name || "Sin ubicación"}
                </h2>
                <h1 className="text-5xl font-extrabold tracking-tight text-white">{container.label}</h1>

                <div className="flex items-center gap-4 mt-2 text-xs font-medium text-zinc-500">
                    <div className="flex items-center gap-1.5">
                        <PackageIcon className="h-3.5 w-3.5" />
                        <span>{items.length} objetos</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5" />
                        <span className="font-mono text-zinc-600">ID: {container.id.slice(0, 8)}</span>
                    </div>
                </div>
            </header>

            {/* Toolbar - Menos dominante pero accesible */}
            <div className="flex items-center justify-between border-t border-white/5 pt-6 pb-2">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-xl bg-zinc-950/50 p-1 border border-white/5">
                        <button className="rounded-lg bg-zinc-900 px-3 py-1.5 text-white shadow-sm shadow-black/50">
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button className="px-3 py-1.5 text-zinc-500 hover:text-white transition-colors">
                            <ListIcon className="h-4 w-4" />
                        </button>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 ml-2">Vista</span>
                </div>

                <NextLink
                    href={`/items/new?container=${container.id}`}
                    className="flex items-center gap-2 rounded-2xl bg-white text-black px-5 py-2.5 text-sm font-bold shadow-xl shadow-white/5 active:scale-95 transition-all"
                >
                    <Plus className="h-4 w-4" /> Agregar Item
                </NextLink>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 mt-2">
                {items.map((item) => (
                    <InventoryCard
                        key={item.id}
                        item={item}
                        signedUrl={signedUrls[item.id]}
                    />
                ))}
                {items.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] bg-zinc-950/30">
                        <PackageIcon className="h-10 w-10 text-zinc-800 mx-auto mb-4 opacity-50" />
                        <p className="text-zinc-600 font-medium italic">Esta caja está vacía.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

