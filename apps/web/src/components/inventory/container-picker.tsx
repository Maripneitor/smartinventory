"use client";

import { useEffect, useState } from "react";
import { containersService } from "@/core/containers";
import { type Container } from "@/entities/container/schema";
import { Button } from "@/components/ui/button";
import { Package, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ContainerPicker(props: {
    locationId: string | null;
    value: string | null;
    onChange: (id: string | null) => void;
}) {
    const [containers, setContainers] = useState<Container[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!props.locationId) {
            setContainers([]);
            return;
        }

        (async () => {
            setLoading(true);
            try {
                const data = await containersService.getByLocation(props.locationId!);
                setContainers(data);
            } catch (e) {
                console.error("Error loading containers for picker", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [props.locationId]);

    const selectedName = containers.find((c) => c.id === props.value)?.label ?? "Objeto suelto (Sin contenedor)";

    if (!props.locationId) {
        return (
            <div className="flex h-14 items-center px-4 rounded-2xl bg-zinc-900/50 border border-white/5 text-zinc-600 italic text-sm">
                Selecciona primero una ubicación...
            </div>
        );
    }

    return (
        <div className="relative space-y-2">
            <Button
                type="button"
                variant="secondary"
                className="w-full justify-between font-bold bg-zinc-900 border border-white/5 hover:bg-zinc-800 hover:border-white/10"
                onClick={() => setOpen(!open)}
            >
                <div className="flex items-center gap-2 truncate">
                    <Package className="h-4 w-4 text-blue-500" />
                    <span className="truncate">{selectedName}</span>
                </div>
                {open ? <ChevronUp className="h-4 w-4 opacity-50" /> : <ChevronDown className="h-4 w-4 opacity-50" />}
            </Button>

            {open && (
                <>
                    <div 
                        className="fixed inset-0 z-40 bg-black/5" 
                        onClick={() => setOpen(false)}
                    />
                    <div className="glass-card absolute z-50 mt-2 w-full overflow-hidden rounded-2xl p-2 shadow-2xl border border-white/10 ring-1 ring-black/20">
                        <div className="max-h-64 overflow-y-auto space-y-1">
                            <button
                                type="button"
                                onClick={() => {
                                    props.onChange(null);
                                    setOpen(false);
                                }}
                                className={cn(
                                    "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-all active:scale-[0.98]",
                                    props.value === null ? "bg-blue-600/20 text-blue-400 border border-blue-500/20" : "hover:bg-white/5 text-zinc-400"
                                )}
                            >
                                <Package className="h-4 w-4 opacity-30" />
                                <span className="text-sm font-medium italic">Objeto suelto (Sin contenedor)</span>
                            </button>

                            {containers.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                        props.onChange(c.id);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-all active:scale-[0.98]",
                                        props.value === c.id ? "bg-blue-600/20 text-blue-400 border border-blue-500/20" : "hover:bg-white/5 text-zinc-400"
                                    )}
                                >
                                    <Package className="h-4 w-4 opacity-50" />
                                    <span className="text-sm font-medium">{c.label}</span>
                                    {c.type && (
                                        <span className="ml-auto text-[8px] font-black uppercase tracking-widest text-zinc-600 bg-zinc-950 px-1.5 py-0.5 rounded">
                                            {c.type.replace('_', ' ')}
                                        </span>
                                    )}
                                </button>
                            ))}

                            {containers.length === 0 && !loading && (
                                <div className="p-4 text-center">
                                    <p className="text-xs text-zinc-600 italic">No hay contenedores en esta ubicación.</p>
                                </div>
                            )}

                            {loading && (
                                <div className="p-4 text-center">
                                    <p className="text-xs text-zinc-600 animate-pulse">Cargando contenedores...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
