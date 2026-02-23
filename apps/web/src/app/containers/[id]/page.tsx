"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, Plus, Printer, MoreVertical, LayoutGrid, List as ListIcon, Info, Loader2, Box as BoxIcon, Package as PackageIcon, MapPin } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { containersService } from "@/core/containers";
import { itemsService, Item } from "@/core/items";
import { createSignedPhotoUrl } from "@/core/storage";

// Fixed Link import for Next.js
import { ContainerLabelPrinter } from "@/components/inventory/container-label-printer";
import NextLink from "next/link";

export default function ContainerDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const [container, setContainer] = useState<any>(null);
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

    const conditionColor = container.condition === "new" ? "text-emerald-500" :
        container.condition === "defective" ? "text-red-500" : "text-blue-500";

    return (
        <div className="flex flex-col gap-6">
            {/* Navbar Superior */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <NextLink href="/" className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400">
                        <ChevronLeft className="h-6 w-6" />
                    </NextLink>
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-bold tracking-tight text-white">{container.label}</h2>
                        <p className="flex items-center gap-1 text-xs text-zinc-500">
                            <MapPin className="h-3 w-3" />
                            {(container.locations as any)?.name || "Sin ubicación"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <ContainerLabelPrinter containerId={container.id} label={container.label} />
                    <div className="h-10 px-3 flex items-center justify-center rounded-xl bg-zinc-900 border border-white/5">
                        <span className={cn("text-[10px] font-bold uppercase tracking-tighter", conditionColor)}>
                            {container.condition || 'bueno'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Header Caja */}
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500">
                    {container.locations?.name || "Sin ubicación"}
                </div>
                <h1 className="font-display text-4xl font-bold tracking-tight">{container.label}</h1>
                <div className="flex items-center gap-4 text-sm text-zinc-500">
                    <div className="flex items-center gap-1">
                        <BoxIcon className="h-4 w-4" /> {items.length} objetos
                    </div>
                    <div className="flex items-center gap-1">
                        <Info className="h-4 w-4" /> QR: {container.id.slice(0, 8)}...
                    </div>
                </div>
            </header>

            {/* Toolbar */}
            <div className="flex items-center justify-between border-y border-white/5 py-4">
                <div className="flex items-center gap-2 rounded-xl bg-zinc-900 p-1 text-zinc-500">
                    <button className="rounded-lg bg-zinc-800 px-3 py-1.5 text-white">
                        <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button className="px-3 py-1.5">
                        <ListIcon className="h-4 w-4" />
                    </button>
                </div>
                <NextLink
                    href={`/items/new?container=${container.id}`}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                    <Plus className="h-4 w-4" /> Agregar Item
                </NextLink>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {items.map((item) => (
                    <div key={item.id} className="glass-card group relative flex flex-col gap-3 p-2">
                        <div className="aspect-square w-full overflow-hidden rounded-xl bg-zinc-900">
                            {item.photo_path && signedUrls[item.id] ? (
                                <img src={signedUrls[item.id]} className="h-full w-full object-cover transition-transform group-hover:scale-110" alt={item.name} />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-zinc-800">
                                    <PackageIcon className="h-10 w-10 opacity-20" />
                                </div>
                            )}

                            {item.belongs_to_item_id && (
                                <div className="absolute right-4 top-4 rounded-full bg-black/60 px-2 py-1 text-[8px] font-bold uppercase tracking-tight text-emerald-400 backdrop-blur-md">
                                    Vinculado
                                </div>
                            )}
                        </div>

                        <div className="px-1 pb-1">
                            <p className="line-clamp-1 text-sm font-bold">{item.name}</p>
                            <div className="mt-1 flex items-center justify-between">
                                <span className="text-[10px] font-medium text-zinc-500">Cant: {item.quantity}</span>
                                <span className={
                                    `rounded-md px-1.5 py-0.5 text-[8px] font-bold uppercase ${item.condition === 'new' ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-900 text-zinc-400"}`
                                }>
                                    {item.condition === 'new' ? 'Nuevo' : item.condition === 'used' ? 'Usado' : 'Defecto'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
                {items.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-900 rounded-3xl">
                        <p className="text-zinc-600 italic">Esta caja está vacía.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
