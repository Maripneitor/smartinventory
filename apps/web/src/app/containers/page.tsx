"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { type Container } from "@/entities/container/schema";
import { containersService } from "@/core/containers";
import { 
  ChevronLeft, 
  Plus, 
  Box, 
  MapPin, 
  Search, 
  Filter, 
  ArrowUpDown, 
  MoreVertical,
  Calendar,
  Layers,
  Activity
} from "lucide-react";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { db } from "@/core/db";

const getContainerIcon = (type?: string) => {
    switch (type) {
        case 'cesto': return Layers;
        case 'bolsa': return Box;
        case 'caja_zapatos': return Activity;
        case 'caja_carton':
        default: return Box;
    }
};

const getContainerLabel = (type?: string) => {
    switch (type) {
        case 'caja_carton': return "Caja de Cartón";
        case 'cesto': return "Cesto / Canasta";
        case 'bolsa': return "Bolsa";
        case 'caja_zapatos': return "Caja de Zapatos";
        default: return "Contenedor";
    }
};

function ContainersList() {
    const sp = useSearchParams();
    const locationFilter = sp.get("location");
    const [containers, setContainers] = useState<(Container & { itemCount?: number })[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        async function load() {
            try {
                const data = await containersService.getAll();
                const withCounts = await Promise.all((data || []).map(async c => {
                    const count = await db.items.where('container_id').equals(c.id).count();
                    return { ...c, itemCount: count };
                }));
                setContainers(withCounts);
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

    if (loading) return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <Spinner size="lg" />
      </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-primary font-body text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                        <Layers className="h-3 w-3" /> Inventario
                    </div>
                    <h2 className="font-headline text-4xl font-bold text-on-surface tracking-tight">Vista de Contenedores</h2>
                    <p className="font-body text-on-surface-variant mt-2 text-lg">Objetos activos en todos los nodos de almacenamiento.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative group flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar contenedores..."
                            className="w-full h-12 pl-12 pr-4 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl font-body text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="h-12 w-12 flex items-center justify-center bg-surface-container-lowest border border-outline-variant/30 rounded-2xl text-on-surface-variant hover:bg-surface-container transition-colors shadow-sm active:scale-95">
                        <Filter className="h-5 w-5" />
                    </button>
                    <Link href="/containers/new">
                        <button className="h-12 px-6 bg-gradient-to-br from-primary to-primary-container text-white rounded-2xl font-body font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            <span className="hidden sm:inline">Nuevo Contenedor</span>
                        </button>
                    </Link>
                </div>
            </div>

            {/* Containers Grid (Bento Style) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map((container) => (
                    <Link key={container.id} href={`/containers/${container.id}`} className="group">
                        <div className="bg-surface-container-lowest rounded-3xl p-6 cloud-shadow border border-outline-variant/5 hover:border-primary/20 hover:bg-surface-container-low transition-all duration-300 relative overflow-hidden h-full flex flex-col">
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                            
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div className="h-14 w-14 rounded-2xl bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
                                    {(() => {
                                        const IconComponent = getContainerIcon((container as any).type);
                                        return <IconComponent className="h-7 w-7" />;
                                    })()}
                                </div>
                                <div className="flex gap-2">
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                        (container.itemCount || 0) >= ((container as any).max_capacity || 20) 
                                            ? "bg-red-100 text-red-700 border border-red-200"
                                            : "bg-green-100 text-green-700 border border-green-200"
                                    )}>
                                        {getContainerLabel((container as any).type)}
                                    </span>
                                    <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
                                        <MoreVertical className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="mb-6 flex-1 relative z-10">
                                <h3 className="font-headline text-xl font-bold text-on-surface mb-1 group-hover:text-primary transition-colors">
                                    {container.label}
                                </h3>
                                <div className="flex items-center gap-1.5 text-on-surface-variant font-body text-xs font-medium">
                                    <MapPin className="h-3 w-3" />
                                    {container.locations?.name || "Sin ubicación asignada"}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-outline-variant/10 pt-6 relative z-10">
                                <div className="space-y-1">
                                    <p className="font-body text-[10px] font-black uppercase tracking-[0.15em] text-on-surface-variant/50 flex items-center gap-1">
                                        <Activity className="h-3 w-3" /> Capacidad
                                    </p>
                                    <div className="flex items-end gap-2">
                                        <p className="font-headline text-lg font-bold text-on-surface">
                                            {Math.round(((container.itemCount || 0) / ((container as any).max_capacity || 20)) * 100)}%
                                        </p>
                                        <div className="flex-1 h-1.5 bg-surface-container rounded-full mb-1.5 overflow-hidden">
                                            <div 
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-500",
                                                    (container.itemCount || 0) >= ((container as any).max_capacity || 20) ? "bg-red-500" : "bg-primary"
                                                )}
                                                style={{ width: `${Math.min(100, ((container.itemCount || 0) / ((container as any).max_capacity || 20)) * 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 font-bold">{container.itemCount || 0} / {(container as any).max_capacity || 20} items</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="font-body text-[10px] font-black uppercase tracking-[0.15em] text-on-surface-variant/50 flex items-center gap-1">
                                        <Calendar className="h-3 w-3" /> Último Escaneo
                                    </p>
                                    <p className="font-headline text-sm font-bold text-on-surface">Hace 2 días</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Empty State */}
            {filtered.length === 0 && (
                <div className="py-32 text-center flex flex-col items-center gap-6 bg-surface-container-low/30 rounded-[3rem] border-2 border-dashed border-outline-variant/20">
                    <div className="h-24 w-24 rounded-[2.5rem] bg-surface-container-lowest flex items-center justify-center shadow-sm text-on-surface-variant/20">
                        <Box className="h-12 w-12" />
                    </div>
                    <div className="flex flex-col gap-2 max-w-xs mx-auto">
                        <h3 className="font-headline text-xl font-bold text-on-surface">No se encontraron contenedores</h3>
                        <p className="font-body text-on-surface-variant text-sm">Intenta con otro término de búsqueda o registra una nueva unidad de almacenamiento.</p>
                    </div>
                    <Link href="/containers/new">
                        <button className="h-11 px-8 bg-surface-container-highest text-on-surface font-body font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-primary hover:text-white transition-all active:scale-95 shadow-sm">
                            Crear Primer Contenedor
                        </button>
                    </Link>
                </div>
            )}
        </div>
    );
}

export default function ContainersPage() {
    return (
        <Suspense fallback={
          <div className="flex h-screen items-center justify-center bg-surface">
            <Spinner size="lg" />
          </div>
        }>
            <ContainersList />
        </Suspense>
    );
}
