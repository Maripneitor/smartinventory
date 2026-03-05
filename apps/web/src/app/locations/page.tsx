"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { locationsService, type Location as InventoryLocation, type LocationTreeNode } from "@/core/locations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Card } from "@/components/ui/card";

export default function LocationsPage() {
    const [locations, setLocations] = useState<InventoryLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState("");
    const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

    async function loadLocations() {
        try {
            const data = await locationsService.getAll();
            setLocations(data);
        } catch (error) {
            console.error("Error loading locations:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadLocations();
    }, []);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!newName.trim()) return;

        try {
            await locationsService.create({
                name: newName,
                parent_id: selectedParentId || undefined
            });
            setNewName("");
            setSelectedParentId(null);
            loadLocations();
        } catch (e) {
            console.error("Error al crear ubicación", e);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Spinner /></div>;

    const tree: LocationTreeNode[] = locationsService.buildTree(locations);

    return (
        <div className="flex flex-col gap-10 max-w-[60rem] mx-auto pb-40">
            <header className="flex flex-col gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-emerald-500/10 border border-emerald-500/20 mb-2">
                    <MapPin className="h-6 w-6 text-emerald-500" />
                </div>
                <h1 className="font-display text-4xl font-black tracking-tight text-white">Ubicaciones</h1>
                <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">Jerarquía Visual de tu Almacén</p>
            </header>

            {/* Formulario */}
            <Card variant="secondary" className="border-blue-500/10">
                <form onSubmit={handleCreate} className="flex flex-col gap-8">
                    <div className="flex flex-col gap-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Crear Nueva Ubicación</label>
                        <div className="flex gap-3">
                            <Input
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="Ej. Habitación Principal, Estante A..."
                                className="flex-1 h-14 bg-zinc-950/50 rounded-2xl"
                            />
                            <Button type="submit" className="h-14 px-8 rounded-2xl">
                                <Plus className="h-5 w-5 mr-2" /> Agregar
                            </Button>
                        </div>
                    </div>

                    {locations.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Jerarquía / Nivel Superior</label>
                            <div className="relative">
                                <select
                                    value={selectedParentId || ""}
                                    onChange={e => setSelectedParentId(e.target.value || null)}
                                    className="w-full rounded-2xl bg-zinc-950/50 border border-white/5 px-4 h-14 text-white font-bold focus:border-blue-500 focus:outline-none transition-all appearance-none"
                                >
                                    <option value="" className="bg-zinc-900 border-none">Sin Padre (Nivel Raíz)</option>
                                    {locations.map(l => (
                                        <option key={l.id} value={l.id} className="bg-zinc-900">{l.name}</option>
                                    ))}
                                </select>
                                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 pointer-events-none rotate-90" />
                            </div>
                        </div>
                    )}
                </form>
            </Card>

            {/* Árbol Visual */}
            <div className="flex flex-col gap-3">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 px-4">Mapa Estructural</h2>
                <div className="flex flex-col gap-1 p-2 bg-zinc-950 rounded-[2rem] border border-white/5">
                    {tree.map(node => (
                        <LocationNode key={node.id} node={node} />
                    ))}
                    {tree.length === 0 && (
                        <div className="py-20 text-center flex flex-col items-center gap-4">
                            <MapPin className="h-10 w-10 text-zinc-800 opacity-20" />
                            <p className="text-zinc-600 italic font-medium">No has creado ubicaciones todavía.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function LocationNode({ node, depth = 0 }: { node: LocationTreeNode, depth?: number }) {
    return (
        <div className="flex flex-col">
            <div
                className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group cursor-pointer",
                    depth > 0 && "ml-8 relative"
                )}
            >
                {depth > 0 && (
                    <div className="absolute left-[-20px] top-1/2 w-4 h-px bg-white/10" />
                )}

                <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg border",
                    depth === 0
                        ? "bg-blue-600/10 border-blue-500/20 text-blue-500"
                        : "bg-zinc-900 border-white/5 text-zinc-600"
                )}>
                    <MapPin className="h-4 w-4" />
                </div>

                <Link href={`/containers?location=${node.id}`} className="flex-1 font-bold text-zinc-100 group-hover:text-blue-500 transition-colors">
                    {node.name}
                </Link>

                <Button
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                    onClick={(e) => {
                        e.stopPropagation();
                        // delete logic if needed
                    }}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            {node.children?.map((child) => (
                <LocationNode key={child.id} node={child} depth={depth + 1} />
            ))}
        </div>
    );
}
