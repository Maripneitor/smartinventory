"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { type Container } from "@/entities/container/schema";
import { containersService } from "@/core/containers";
import { locationsService } from "@/core/locations";
import { ChevronLeft, Plus, Box, MapPin, Search, Loader2 } from "lucide-react";
import Link from "next/link";

function ContainersList() {
    const sp = useSearchParams();
    const locationFilter = sp.get("location");
    const [containers, setContainers] = useState<Container[]>([]);

    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        async function load() {
            try {
                const data = await containersService.getAll();
                setContainers(data || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const filtered = containers.filter(c => {
        const matchesSearch = c.label.toLowerCase().includes(search.toLowerCase()) ||
            (c.locations?.name || "").toLowerCase().includes(search.toLowerCase());
        const matchesLocation = !locationFilter || c.location_id === locationFilter;
        return matchesSearch && matchesLocation;
    });

    if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400">
                            <ChevronLeft className="h-6 w-6" />
                        </Link>
                        <h1 className="text-2xl font-bold text-white">Mis Cajas</h1>
                    </div>
                    <Link href="/containers/new" className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                        <Plus className="h-6 w-6" />
                    </Link>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o ubicación..."
                        className="w-full rounded-2xl bg-zinc-900 py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((container) => (
                    <Link key={container.id} href={`/containers/${container.id}`} className="glass-card flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 group-hover:bg-blue-600/20">
                            <Box className="h-6 w-6 text-zinc-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-white">{container.label}</p>
                            <p className="flex items-center gap-1 text-xs text-zinc-500">
                                <MapPin className="h-3 w-3" />
                                {container.locations?.name || "Sin ubicación"}
                            </p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                            ID
                        </div>
                    </Link>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="py-20 text-center">
                    <Box className="mx-auto h-12 w-12 text-zinc-800 mb-4" />
                    <p className="text-zinc-600 italic">No se encontraron cajas.</p>
                </div>
            )}
        </div>
    );
}

export default function ContainersPage() {
    return (
        <Suspense fallback={<div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>}>
            <ContainersList />
        </Suspense>
    );
}
