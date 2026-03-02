"use client";

import { useEffect, useState } from "react";
import { containersService } from "@/core/containers";
import { itemsService } from "@/core/items";
import {
  Box,
  Package,
  TrendingUp,
  BarChart3,
  Plus,
  Search,
  QrCode,
  ChevronRight,
  Loader2,
  LogOut,
  PlusCircle,
} from "lucide-react";
import Link from "next/link";
import { type Item } from "@/entities/item/schema";
import { createClient, getDevUser } from "@/lib/supabase/browser";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ totalContainers: 0, totalItems: 0 });
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const handleExport = async () => {
    try {
      await itemsService.exportToCSV();
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const currentUser = await getDevUser();
        setUser(currentUser);

        const [s, items] = await Promise.all([
          containersService.getStats(),
          itemsService.getAll()
        ]);
        setStats(s);
        setRecentItems(items.slice(0, 5));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="flex flex-col gap-8 pb-20 max-w-2xl mx-auto">
      <header className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-500">Panel de Control</p>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Hola, {user?.email?.split('@')[0] || 'Usuario'}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => itemsService.exportToCSV()}
            className="h-10 px-4 rounded-xl bg-zinc-900 text-[10px] font-bold uppercase tracking-widest text-zinc-500 border border-white/5 active:scale-95 transition-all"
          >
            Exportar
          </button>
          <button
            onClick={handleSignOut}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-500 hover:text-red-400 border border-white/5 transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/analytics" className="group glass-card flex flex-col gap-2 p-6 bg-zinc-900/40 border-white/5 rounded-[2rem] active:scale-95 transition-all hover:bg-zinc-800/40">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 shadow-inner group-hover:scale-110 transition-transform">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-4xl font-black text-white leading-none">{stats.totalItems}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mt-2 flex items-center gap-1.5 focus:text-blue-500">
              Inventario <ChevronRight className="h-3 w-3" />
            </p>
          </div>
        </Link>
        <Link href="/containers" className="group glass-card flex flex-col gap-2 p-6 bg-zinc-900/40 border-white/5 rounded-[2rem] active:scale-95 transition-all hover:bg-zinc-800/40">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 shadow-inner group-hover:scale-110 transition-transform">
            <Box className="h-5 w-5" />
          </div>
          <div>
            <p className="text-4xl font-black text-white leading-none">{stats.totalContainers}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mt-2 flex items-center gap-1.5 focus:text-purple-500">
              Cajas <ChevronRight className="h-3 w-3" />
            </p>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <section className="flex flex-col gap-4">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1">Acciones Rápidas</h2>
        <div className="grid grid-cols-3 gap-3">
          <Link href="/scan" className="flex flex-col items-center gap-2 rounded-[2rem] bg-zinc-900/50 p-4 border border-white/5 active:scale-95 transition-all hover:bg-zinc-800/50">
            <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/30">
              <QrCode className="h-7 w-7" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tighter text-zinc-400 mt-1">Escanear</span>
          </Link>
          <Link href="/search" className="flex flex-col items-center gap-2 rounded-[2rem] bg-zinc-900/50 p-4 border border-white/5 active:scale-95 transition-all hover:bg-zinc-800/50">
            <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-zinc-900 border border-white/10 text-zinc-400">
              <Search className="h-7 w-7" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tighter text-zinc-400 mt-1">Buscar</span>
          </Link>
          <Link href="/containers" className="flex flex-col items-center gap-2 rounded-[2rem] bg-zinc-900/50 p-4 border border-white/5 active:scale-95 transition-all hover:bg-zinc-800/50">
            <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-zinc-900 border border-white/10 text-zinc-400">
              <Box className="h-7 w-7" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tighter text-zinc-400 mt-1">Inventario</span>
          </Link>
        </div>
      </section>

      {/* Recent Items */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Últimos Registros</h2>
          <Link href="/items/new" className="text-[10px] font-bold uppercase text-blue-500 flex items-center gap-1.5 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
            <PlusCircle className="h-3 w-3" /> Nuevo Item
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {recentItems.map((item) => (
            <Link
              key={item.id}
              href={`/containers/${item.container_id}`}
              className="group flex items-center gap-4 rounded-[1.5rem] bg-zinc-900/30 p-4 border border-white/5 hover:bg-zinc-800/40 hover:border-white/10 transition-all active:scale-[0.98]"
            >
              <div className="h-12 w-12 shrink-0 rounded-2xl bg-zinc-900 flex items-center justify-center border border-white/5 shadow-inner">
                <Package className="h-6 w-6 text-zinc-700 group-hover:text-blue-500 transition-colors" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-bold text-white truncate text-sm">{item.name}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-tight font-medium mt-0.5">En {item.category || "General"}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-800 group-hover:text-zinc-600 transition-colors" />
            </Link>
          ))}
          {recentItems.length === 0 && (
            <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] bg-zinc-900/20">
              <Box className="h-10 w-10 text-zinc-800 mx-auto mb-3" />
              <p className="text-zinc-600 font-medium text-sm">Tu inventario está vacío.</p>
              <p className="text-zinc-800 text-xs mt-1">Escanea una caja para comenzar.</p>
            </div>
          )}
        </div>
      </section>

      {/* Analytics Teaser */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-2xl shadow-blue-500/20 group">
        <div className="absolute -right-6 -bottom-6 h-32 w-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
        <div className="relative flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <h3 className="font-bold uppercase tracking-widest text-[10px] opacity-80">Magic Search & Insights</h3>
          </div>
          <div>
            <p className="text-2xl font-black leading-tight">Encuentra cualquier objeto con lenguaje natural.</p>
            <p className="text-white/60 text-xs mt-2 font-medium">IA avanzada entrenada para entender tu almacén.</p>
          </div>
          <Link href="/search" className="w-fit rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all">
            Probar Búsqueda IA
          </Link>
        </div>
      </section>
    </div>
  );
}
