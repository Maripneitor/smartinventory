"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ChevronRight, MapPin, Loader2, Home } from "lucide-react";
import Link from "next/link";
import { locationsService, type Location as InventoryLocation, type LocationTreeNode } from "@/core/locations";
import { cn } from "@/lib/utils";

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

    if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin" /></div>;

    const tree: LocationTreeNode[] = locationsService.buildTree(locations);

    return (
        <div className="flex flex-col gap-8 max-w-2xl mx-auto">
            <header>
                <h1 className="font-display text-4xl font-bold">Ubicaciones</h1>
                <p className="text-zinc-500">Organiza tu casa en niveles jerárquicos.</p>
            </header>

            {/* Formulario */}
            <form onSubmit={handleCreate} className="glass-card flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase text-zinc-500">Nueva Ubicación</label>
                    <div className="flex gap-2">
                        <input
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="Ej. Habitación Principal o Estante A"
                            className="flex-1 rounded-xl bg-zinc-900 border border-white/5 px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                        />
                        <button type="submit" className="rounded-xl bg-blue-600 px-6 font-bold active:scale-95">Agregar</button>
                    </div>
                </div>

                {locations.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase text-zinc-500">¿Dentro de otra?</label>
                        <select
                            value={selectedParentId || ""}
                            onChange={e => setSelectedParentId(e.target.value || null)}
                            className="rounded-xl bg-zinc-900 border border-white/5 px-4 py-3 text-white focus:outline-none appearance-none"
                        >
                            <option value="">Raíz (Nivel principal)</option>
                            {locations.map(l => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </form>

            {/* Árbol Visual */}
            <div className="flex flex-col gap-2">
                {tree.map(node => (
                    <LocationNode key={node.id} node={node} />
                ))}
                {tree.length === 0 && <p className="text-center py-10 text-zinc-600 italic">No hay ubicaciones creadas.</p>}
            </div>
        </div>
    );
}

function LocationNode({ node, depth = 0 }: { node: any, depth?: number }) {
    return (
        <div className="flex flex-col">
            <div
                className={cn(
                    "flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group",
                    depth > 0 && "ml-6 border-l border-white/10"
                )}
            >
                <MapPin className={cn("h-4 w-4", depth === 0 ? "text-blue-500" : "text-zinc-600")} />
                <Link href={`/containers?location=${node.id}`} className="flex-1 font-medium hover:text-blue-500 transition-colors">
                    {node.name}
                </Link>
                <button className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all">
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
            {node.children?.map((child: any) => (
                <LocationNode key={child.id} node={child} depth={depth + 1} />
            ))}
        </div>
    );
}
