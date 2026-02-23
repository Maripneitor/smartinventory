"use client";

import { useEffect, useMemo, useState } from "react";
import { listDevices } from "@/core/devices";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Laptop, ChevronDown, ChevronUp, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type DeviceRow = { id: string; name: string; photo_path: string | null };

export function DevicePicker(props: {
    value: string;
    onChange: (id: string) => void;
    hint?: string | null; // “posible_dispositivo” de IA
}) {
    const [q, setQ] = useState("");
    const [devices, setDevices] = useState<DeviceRow[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const data = await listDevices();
                setDevices(data as DeviceRow[]);
            } catch (e) {
                console.error("Error loading devices", e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return devices;
        return devices.filter((d) => d.name.toLowerCase().includes(s));
    }, [q, devices]);

    const selected = devices.find((d) => d.id === props.value);

    return (
        <div className="relative space-y-2">
            <Button
                type="button"
                variant="outline"
                className="w-full justify-between font-normal"
                onClick={() => setOpen(!open)}
            >
                <span className="truncate flex items-center gap-2">
                    <Laptop className="h-4 w-4 opacity-50" />
                    {selected?.name ?? "Seleccionar dispositivo..."}
                </span>
                {open ? <ChevronUp className="h-4 w-4 opacity-50" /> : <ChevronDown className="h-4 w-4 opacity-50" />}
            </Button>

            {props.hint && !selected && (
                <div className="flex items-center gap-2 px-1 text-[10px] text-blue-400 font-bold uppercase tracking-widest bg-blue-500/5 py-1 rounded-md">
                    IA sugiere: {props.hint}
                </div>
            )}

            {open && (
                <div className="glass-card absolute z-50 mt-1 w-full overflow-hidden rounded-2xl p-3 shadow-2xl border border-white/10">
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <Input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Buscar equipo..."
                            className="h-10 pl-10 text-sm"
                            autoFocus
                        />
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {loading ? (
                            <div className="p-4 text-center text-xs text-zinc-600">Cargando...</div>
                        ) : filtered.length === 0 ? (
                            <div className="p-4 text-center text-xs text-zinc-600 italic">
                                {q ? "No hay resultados" : "No tienes dispositivos registrados aún."}
                            </div>
                        ) : (
                            filtered.map((d) => (
                                <button
                                    key={d.id}
                                    type="button"
                                    onClick={() => {
                                        props.onChange(d.id);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all active:scale-[0.98]",
                                        props.value === d.id ? "bg-blue-600/20 text-blue-400 border border-blue-500/20" : "hover:bg-white/5 text-zinc-400"
                                    )}
                                >
                                    <div className="h-8 w-8 rounded-lg bg-zinc-950 flex items-center justify-center border border-white/5">
                                        <Laptop className="h-4 w-4 opacity-30" />
                                    </div>
                                    <span className="text-sm font-medium">{d.name}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
