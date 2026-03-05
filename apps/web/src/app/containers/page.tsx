"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { type Container } from "@/entities/container/schema";
import { containersService } from "@/core/containers";
import { ChevronLeft, Plus, Box, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

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

    if (loading) return <div className="flex h-screen items-center justify-center"><Spinner /></div>;

    return (
        <div className="flex flex-col gap-8 pb-40">
            <header className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-white/5 active:scale-95 transition-all"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="text-3xl font-black tracking-tight text-white">Inventario</h1>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Gestión de Cajas y Contenedores</p>
                        </div>
                    </div>
                    <Link href="/containers/new">
                        <Button className="h-12 w-12 p-0 rounded-2xl shadow-xl shadow-blue-500/20">
                            <Plus className="h-6 w-6" />
                        </Button>
                    </Link>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                        type="text"
                        placeholder="Buscar por nombre o ubicación..."
                        className="pl-12 h-14 bg-zinc-950/50 rounded-2xl border-white/5"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((container) => (
                    <Link key={container.id} href={`/containers/${container.id}`}>
                        <Card interactive className="flex items-center gap-5 p-4 rounded-[1.75rem]">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-white/5 group-hover:bg-blue-600/10 group-hover:text-blue-500 group-hover:border-blue-500/20 transition-all">
                                <Box className="h-7 w-7 text-zinc-600 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-black text-white text-lg truncate group-hover:text-blue-400 transition-colors leading-tight">
                                    {container.label}
                                </h3>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">
                                    <MapPin className="h-3 w-3 text-zinc-700" />
                                    <span className="truncate">{container.locations?.name || "Sin ubicación"}</span>
                                </div>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-zinc-950 flex items-center justify-center text-[10px] font-black text-zinc-700 border border-white/5">
                                <ChevronLeft className="h-4 w-4 rotate-180" />
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="py-32 text-center flex flex-col items-center gap-6">
                    <div className="h-20 w-20 rounded-[2rem] bg-zinc-950 flex items-center justify-center border border-white/5">
                        <Box className="h-10 w-10 text-zinc-900" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">No se encontraron cajas</p>
                        <p className="text-zinc-700 text-xs">Intenta con otro término de búsqueda o crea una nueva.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ContainersPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner /></div>}>
            <ContainersList />
        </Suspense>
    );
}
