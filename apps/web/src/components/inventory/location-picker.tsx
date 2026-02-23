"use client";

import { useEffect, useMemo, useState } from "react";
import { locationsService, listLocations, type Location } from "@/core/locations";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function LocationPicker(props: {
    value: string;
    onChange: (id: string) => void;
}) {
    const [rows, setRows] = useState<Location[]>([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const data = await listLocations();
                setRows(data);
            } catch (e) {
                console.error("Error loading locations for picker", e);
            }
        })();
    }, []);

    const byParent = useMemo(() => {
        const map = new Map<string | null, Location[]>();
        for (const r of rows) {
            const key = r.parent_id ?? null;
            map.set(key, [...(map.get(key) ?? []), r]);
        }
        return map;
    }, [rows]);

    function renderNode(parentId: string | null, depth = 0) {
        const children = byParent.get(parentId) ?? [];
        return children.map((loc) => (
            <div key={loc.id} className="flex flex-col">
                <button
                    type="button"
                    onClick={() => {
                        props.onChange(loc.id);
                        setOpen(false);
                    }}
                    className={cn(
                        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-all active:scale-[0.98]",
                        props.value === loc.id ? "bg-blue-600/20 text-blue-400 border border-blue-500/20" : "hover:bg-white/5 text-zinc-400"
                    )}
                    style={{ marginLeft: depth * 12 }}
                >
                    <MapPin className="h-4 w-4 opacity-50" />
                    <span className="text-sm font-medium">{loc.name}</span>
                </button>
                {renderNode(loc.id, depth + 1)}
            </div>
        ));
    }

    const selectedName = rows.find((r) => r.id === props.value)?.name ?? "Seleccionar ubicación...";

    return (
        <div className="relative space-y-2">
            <Button
                type="button"
                variant="outline"
                className="w-full justify-between font-normal"
                onClick={() => setOpen(!open)}
            >
                <span className="truncate">{selectedName}</span>
                {open ? <ChevronUp className="h-4 w-4 opacity-50" /> : <ChevronDown className="h-4 w-4 opacity-50" />}
            </Button>

            {open && (
                <div className="glass-card absolute z-50 mt-1 w-full overflow-hidden rounded-2xl p-2 shadow-2xl">
                    <div className="max-h-64 overflow-y-auto space-y-1">
                        {rows.length === 0 ? (
                            <div className="p-4 text-center space-y-3">
                                <p className="text-xs text-zinc-600 italic">No hay ubicaciones creadas aún.</p>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="w-full py-2 text-xs"
                                    onClick={() => window.location.href = '/locations'}
                                >
                                    Ir a gestionar Lugares
                                </Button>
                            </div>
                        ) : (
                            <>
                                {renderNode(null)}
                                <div className="mt-2 pt-2 border-t border-white/5">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="w-full text-zinc-500 text-[10px]"
                                        onClick={() => window.location.href = '/locations'}
                                    >
                                        + Gestionar Ubicaciones
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
