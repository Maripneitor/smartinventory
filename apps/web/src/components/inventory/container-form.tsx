"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { containersService } from "@/core/containers";
import { locationsService, type Location } from "@/core/locations";
import { LocationPicker } from "@/components/inventory/location-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Box, Loader2, AlertCircle } from "lucide-react";

export function ContainerForm() {
    const router = useRouter();
    const [label, setLabel] = useState("");
    const [locationId, setLocationId] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [containerId, setContainerId] = useState<string>("");

    useEffect(() => {
        setContainerId(crypto.randomUUID());
    }, []);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg(null);

        if (!label.trim()) return setErrorMsg("Pon un nombre para la caja.");
        if (!locationId) return setErrorMsg("Selecciona una ubicación.");

        setLoading(true);
        try {
            const qr_payload = `${window.location.origin}/containers/${containerId}`;
            await containersService.create({
                id: containerId,
                label: label.trim(),
                location_id: locationId,
                qr_payload,
            });

            router.push(`/containers/${containerId}`);
            router.refresh();
        } catch (err: any) {
            setErrorMsg(err?.message ?? "Error creando la caja.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
            <div className="glass-card flex flex-col gap-5 p-6">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nombre de la Caja</label>
                    <Input
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="Ej: Caja #4 — Cables TV"
                        autoFocus
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Ubicación Física</label>
                    <LocationPicker value={locationId} onChange={setLocationId} />
                </div>

                <div className="rounded-xl bg-zinc-950/50 p-4 border border-white/5">
                    <div className="flex items-center gap-3 text-zinc-500 mb-2">
                        <Box className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Metadata del QR</span>
                    </div>
                    <p className="font-mono text-[10px] break-all text-zinc-600">ID: {containerId}</p>
                </div>

                {errorMsg && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20">
                        <AlertCircle className="h-4 w-4" />
                        {errorMsg}
                    </div>
                )}

                <Button type="submit" disabled={loading} className="w-full py-4 text-lg">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Registrar Caja"}
                </Button>
            </div>
        </form>
    );
}
