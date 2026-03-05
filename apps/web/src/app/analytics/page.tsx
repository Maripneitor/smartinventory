"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, BarChart3, PieChart, TrendingUp, Package, Box, MapPin, Loader2, Info, History } from "lucide-react";
import Link from "next/link";
import { itemsService, type Item } from "@/core/items";
import { containersService } from "@/core/containers";
import { locationsService } from "@/core/locations";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

import { Spinner } from "@/components/ui/spinner";
import { Card } from "@/components/ui/card";

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalItems: 0,
        totalContainers: 0,
        totalLocations: 0,
        categoryBreakdown: {} as Record<string, number>,
        conditionBreakdown: {} as Record<string, number>,
        typeBreakdown: {} as Record<string, number>,
        itemsByContainer: [] as { label: string; count: number }[],
        activityLogs: [] as any[]
    });

    useEffect(() => {
        async function loadData() {
            try {
                const [items, containers, locations, logs] = await Promise.all([
                    itemsService.getAll(),
                    containersService.getAll(),
                    locationsService.getAll(),
                    itemsService.getActivityLogs()
                ]);

                const categoryMap: Record<string, number> = {};
                const conditionMap: Record<string, number> = {};
                const typeMap: Record<string, number> = {};
                const itemsPerContainer: Record<string, number> = {};

                items.forEach((item) => {
                    // Category
                    const cat = item.category || "General";
                    categoryMap[cat] = (categoryMap[cat] || 0) + 1;

                    // Condition
                    conditionMap[item.condition] = (conditionMap[item.condition] || 0) + 1;

                    // Type
                    typeMap[item.item_type] = (typeMap[item.item_type] || 0) + 1;

                    // per container
                    itemsPerContainer[item.container_id] = (itemsPerContainer[item.container_id] || 0) + 1;
                });

                const sortedContainers = (containers || [])
                    .map((c) => ({
                        label: c.label,
                        count: itemsPerContainer[c.id] || 0
                    }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);

                setStats({
                    totalItems: items.length,
                    totalContainers: (containers || []).length,
                    totalLocations: (locations || []).length,
                    categoryBreakdown: categoryMap,
                    conditionBreakdown: conditionMap,
                    typeBreakdown: typeMap,
                    itemsByContainer: sortedContainers,
                    activityLogs: logs || []
                });
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
                <Spinner size="lg" />
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Calculando Insights...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 pb-32">
            <header className="flex items-center gap-4">
                <Link
                    href="/"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 active:scale-95 transition-all"
                >
                    <ChevronLeft className="h-6 w-6" />
                </Link>
                <div className="flex flex-col gap-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-500">Inteligencia</p>
                    <h1 className="text-2xl font-black text-white tracking-tight">Analytics Dashboard</h1>
                </div>
            </header>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Package} label="Objetos" value={stats.totalItems} color="blue" />
                <StatCard icon={Box} label="Cajas" value={stats.totalContainers} color="purple" />
                <StatCard icon={MapPin} label="Ubicaciones" value={stats.totalLocations} color="emerald" />
                <StatCard icon={TrendingUp} label="Valor Est." value={"N/A"} color="amber" />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Categories */}
                <Card variant="glass" className="p-8 flex flex-col gap-6 rounded-[2.5rem]">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Categorías</p>
                            <h3 className="text-lg font-bold text-white">Distribución de Inventario</h3>
                        </div>
                        <PieChart className="h-5 w-5 text-zinc-700" />
                    </div>

                    <div className="flex flex-col gap-4">
                        {Object.entries(stats.categoryBreakdown)
                            .sort((a, b) => (b[1] as number) - (a[1] as number))
                            .slice(0, 5)
                            .map(([cat, count]) => {
                                const percentage = (count as number / stats.totalItems) * 100;
                                return (
                                    <div key={cat} className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-zinc-400 truncate max-w-[140px]">{cat}</span>
                                            <span className="text-white font-black">{count as number} uds.</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-linear-to-r from-blue-600 to-indigo-600 rounded-full"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        {Object.keys(stats.categoryBreakdown).length === 0 && (
                            <p className="text-center text-zinc-700 text-sm py-4 italic">No hay suficientes datos</p>
                        )}
                    </div>
                </Card>

                {/* State / Condition */}
                <Card variant="glass" className="p-8 flex flex-col gap-6 rounded-[2.5rem]">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Estado</p>
                            <h3 className="text-lg font-bold text-white">Salud del Inventario</h3>
                        </div>
                        <BarChart3 className="h-5 w-5 text-zinc-700" />
                    </div>

                    <div className="flex flex-col gap-6 pt-4">
                        <div className="flex items-end justify-between h-32 gap-4">
                            {["new", "used", "defective"].map((cond) => {
                                const count = stats.conditionBreakdown[cond] || 0;
                                const max = Math.max(...Object.values(stats.conditionBreakdown).map(v => v as number), 1);
                                const height = (count / max) * 100;
                                return (
                                    <div key={cond} className="flex-1 flex flex-col items-center gap-3 h-full justify-end">
                                        <div className="relative w-full group">
                                            <div
                                                className={cn(
                                                    "w-full rounded-t-xl transition-all duration-700",
                                                    cond === "new" && "bg-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.2)]",
                                                    cond === "used" && "bg-blue-500/80 shadow-[0_0_20px_rgba(59,130,246,0.2)]",
                                                    cond === "defective" && "bg-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                                                )}
                                                style={{ height: `${height}%`, minHeight: count > 0 ? "10%" : "2%" }}
                                            />
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                {count}
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                            {cond === "new" ? "Nuevo" : cond === "used" ? "Usado" : "Mal"}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Card>

                {/* Top Containers */}
                <Card variant="glass" className="p-8 flex flex-col gap-6 col-span-1 md:col-span-2 rounded-[2.5rem]">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Ocupación</p>
                            <h3 className="text-lg font-bold text-white">Cajas más llenas</h3>
                        </div>
                        <Box className="h-5 w-5 text-zinc-700" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stats.itemsByContainer.map((container, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-950/50 border border-white/5">
                                <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-zinc-900 font-black text-zinc-600 text-xs translate-y-[-2px]">
                                    #{i + 1}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-bold text-white truncate text-sm">{container.label}</p>
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase mt-0.5">{container.count} objetos</p>
                                </div>
                                <div className="h-2 w-12 bg-zinc-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[60%]" style={{ width: `${(container.count / 20) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* AI Insight Teaser */}
            <section className="bg-linear-to-br from-indigo-900/40 to-black border border-indigo-500/20 rounded-[2.5rem] p-8 flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/10 blur-[100px] pointer-events-none" />
                <div className="h-20 w-20 shrink-0 bg-zinc-950 flex items-center justify-center rounded-3xl shadow-xl border border-white/5">
                    <BarChart3 className="h-10 w-10 text-indigo-400" />
                </div>
                <div className="flex flex-col gap-2 text-center sm:text-left">
                    <h3 className="text-xl font-bold text-white">Sugerencia de Organización</h3>
                    <p className="text-sm text-zinc-400 max-w-md">
                        Basado en tus patrones, la IA sugiere mover <span className="text-white font-bold">5 cables</span> de la "Caja A" a una caja específica para "Cables Sueltos" para optimizar espacio.
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-2">
                        <Info className="h-3 w-3" /> Reporte de Optimización v2.1
                    </div>
                </div>
            </section>

            {/* Recent Activity Feed */}
            <section className="flex flex-col gap-6">
                <div className="flex items-center gap-2 px-2">
                    <History className="h-4 w-4 text-zinc-500" />
                    <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Historial Reciente</h2>
                </div>

                <div className="flex flex-col gap-3">
                    {stats.activityLogs.map((log) => (
                        <div key={log.id} className="flex items-center gap-4 p-4 rounded-3xl bg-zinc-900/30 border border-white/5">
                            <div className={cn(
                                "h-10 w-10 shrink-0 flex items-center justify-center rounded-xl font-black text-xs",
                                log.action === 'INSERT' && "bg-emerald-500/10 text-emerald-500",
                                log.action === 'UPDATE' && "bg-blue-500/10 text-blue-500",
                                log.action === 'DELETE' && "bg-red-500/10 text-red-500"
                            )}>
                                {log.action[0]}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="font-bold text-white text-sm truncate">
                                    {log.items?.name || "Objeto desconocido"}
                                </p>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5">
                                    {log.action === 'INSERT' ? 'Añadido' : log.action === 'UPDATE' ? 'Actualizado' : 'Eliminado'} • {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: es })}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                {log.action === 'UPDATE' && log.old_data?.container_id !== log.new_data?.container_id && (
                                    <span className="text-[8px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-black uppercase">
                                        Movimiento
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                    {stats.activityLogs.length === 0 && (
                        <p className="text-center text-zinc-700 text-sm py-8 italic border-2 border-dashed border-white/5 rounded-[2.5rem]">
                            No hay actividad reciente registrada
                        </p>
                    )}
                </div>
            </section>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
    const colorClasses: Record<string, string> = {
        blue: "bg-blue-500/10 text-blue-500",
        purple: "bg-purple-500/10 text-purple-500",
        emerald: "bg-emerald-500/10 text-emerald-500",
        amber: "bg-amber-500/10 text-amber-500"
    };

    return (
        <Card variant={color as any} interactive className="flex flex-col gap-4">
            <div className={cn("h-10 w-10 flex items-center justify-center rounded-xl", colorClasses[color])}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-3xl font-black text-white">{value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mt-1">{label}</p>
            </div>
        </Card>
    );
}
