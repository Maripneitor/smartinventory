"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, Plus, LayoutGrid, List as ListIcon, Info, Package as PackageIcon, MapPin, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NextLink from "next/link";
import { cn } from "@/lib/utils";
import { type Container } from "@/entities/container/schema";
import { type Item } from "@/entities/item/schema";
import { containersService } from "@/core/containers";
import { itemsService } from "@/core/items";
import { createSignedPhotoUrl, createSignedPhotoUrls } from "@/core/storage";
import { ContainerLabelPrinter } from "@/components/inventory/container-label-printer";
import { InventoryCard } from "@/components/inventory/inventory-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

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

                const urls: Record<string, string> = {};

                // Extraer los paths no vacíos
                const itemsConFoto = iData.filter(i => !!i.photo_path);
                const paths = itemsConFoto.map(i => i.photo_path as string);

                if (paths.length > 0) {
                    try {
                        const signedData = await createSignedPhotoUrls(paths);
                        // Map results back by matching the path
                        itemsConFoto.forEach(item => {
                            const found = signedData.find((d: any) => d.path === item.photo_path);
                            if (found && !found.error && found.signedUrl) {
                                urls[item.id] = found.signedUrl;
                            }
                        });
                    } catch (e) {
                        console.error("Error signing URLs", e);
                    }
                }

                setSignedUrls(urls);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [id]);

    if (loading) return <div className="flex h-screen items-center justify-center"><Spinner /></div>;
    if (!container) return <div className="text-center py-20 text-zinc-500 min-h-screen flex items-center justify-center">Caja no encontrada.</div>;

    const isFull = items.length >= (container.max_items || 50);
    const capacityPercent = Math.min(100, (items.length / (container.max_items || 50)) * 100);

    return (
        <div className="flex flex-col gap-8 pb-40">
            {/* Navbar Superior */}
            <div className="flex items-center justify-between">
                <NextLink
                    href="/containers"
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-white/5 active:scale-95 transition-all"
                >
                    <ChevronLeft className="h-6 w-6" />
                </NextLink>

                <div className="flex items-center gap-3">
                    <ContainerLabelPrinter containerId={container.id} label={container.label} />
                    <Card variant="secondary" className="px-4 py-2 flex flex-col justify-center min-w-[120px] rounded-2xl">
                        <div className="flex justify-between items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Cupo</span>
                            <span className={cn("text-[10px] font-black uppercase", isFull ? "text-red-500" : "text-zinc-400")}>
                                {items.length}/{container.max_items || 50}
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                            <div
                                className={cn("h-full transition-all duration-700",
                                    isFull ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" :
                                        capacityPercent > 80 ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" :
                                            "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                                )}
                                style={{ width: `${capacityPercent}%` }}
                            />
                        </div>
                    </Card>
                </div>
            </div>

            {/* Alerta de Capacidad */}
            {isFull && (
                <div className="flex items-center gap-5 rounded-[2rem] bg-red-500/10 border border-red-500/20 p-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/20 text-red-500 shadow-xl shadow-red-500/10">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-black text-red-400 uppercase tracking-widest leading-none mb-1">Caja al Límite</h4>
                        <p className="text-xs text-red-400/60 font-medium">Has alcanzado el máximo de {container.max_items} objetos.</p>
                    </div>
                </div>
            )}

            {/* Header Principal */}
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/80 bg-blue-500/5 px-3 py-1 rounded-lg border border-blue-500/10 w-fit">
                    <MapPin className="h-3 w-3" />
                    {container.locations?.name || "Sin ubicación"}
                </div>
                <h1 className="text-5xl font-black tracking-tight text-white leading-tight break-words">{container.label}</h1>

                <div className="flex items-center gap-6 mt-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
                    <div className="flex items-center gap-2">
                        <PackageIcon className="h-4 w-4 text-zinc-700" />
                        <span>{items.length} Objetos</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-zinc-700" />
                        <span className="font-mono text-zinc-800">#{container.id.slice(0, 8)}</span>
                    </div>
                </div>
            </header>

            {/* Toolbar */}
            <div className="flex items-center justify-between border-t border-white/5 pt-8">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 rounded-2xl bg-zinc-950 p-1 border border-white/5 shadow-inner">
                        <button className="rounded-xl bg-zinc-900 px-4 py-2 text-white border border-white/5 shadow-xl">
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button className="px-4 py-2 text-zinc-600 hover:text-white transition-colors">
                            <ListIcon className="h-4 w-4" />
                        </button>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-700 ml-2">Vista de Items</span>
                </div>

                <NextLink href={`/items/new?container=${container.id}`}>
                    <Button className="h-12 px-6 rounded-2xl shadow-2xl shadow-blue-500/20 font-black tracking-tight">
                        <Plus className="h-5 w-5 mr-2" /> Agregar Item
                    </Button>
                </NextLink>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 mt-2">
                <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 10 }}
                            transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                        >
                            <InventoryCard
                                item={item}
                                signedUrl={signedUrls[item.id]}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>

                {items.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="col-span-full py-28 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-zinc-950/50 relative overflow-hidden group"
                    >
                        {/* Decorative BG Gradient */}
                        <div className="absolute inset-0 bg-linear-to-b from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                        <motion.div
                            animate={{
                                scale: [1, 1.05, 1],
                                rotate: [0, 2, -2, 0]
                            }}
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="relative z-10"
                        >
                            <PackageIcon className="h-20 w-20 text-zinc-900 mx-auto mb-8" />
                        </motion.div>

                        <div className="relative z-10 flex flex-col gap-3">
                            <p className="text-zinc-600 font-black uppercase tracking-widest text-xs">Caja sin contenido</p>
                            <p className="text-zinc-800 text-sm font-medium italic max-w-xs mx-auto">
                                Esta caja está vacía. Empieza a añadir objetos para organizar tu inventario.
                            </p>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
