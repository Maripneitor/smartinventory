"use client";

import { useEffect, useState } from "react";
import { containersService } from "@/core/containers";
import { itemsService } from "@/core/items";
import {
  Box,
  Package,
  TrendingUp,
  BarChart3,
  Search,
  QrCode,
  ChevronRight,
  LogOut,
  PlusCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { type Item } from "@/entities/item/schema";
import { createClient, getDevUser } from "@/lib/supabase/browser";
import { Spinner } from "@/components/ui/spinner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ totalContainers: 0, totalItems: 0 });
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

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

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div className="flex flex-col gap-10 pb-40 max-w-2xl mx-auto">
      <header className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-600">SISTEMA INTELIGENTE</p>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
            Hola, <span className="text-sky-600">{user?.email?.split('@')[0] || 'Usuario'}</span>
          </h1>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl bg-white text-slate-900 hover:bg-sky-50"
            onClick={() => itemsService.exportToCSV()}
          >
            Data
          </Button>
          <Button
            variant="ghost"
            className="h-10 w-10 p-0 rounded-xl bg-sky-100 border-sky-200 text-slate-500 hover:text-red-500 transition-colors"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-5">
        <Link href="/analytics" className="group">
          <Card interactive className="flex flex-col gap-4 p-6 rounded-[2rem] bg-white border-sky-100 hover:border-sky-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-sky-100 text-sky-600 shadow-[inset_0_0_10px_rgba(14,165,233,0.1)] group-hover:scale-110 group-hover:bg-sky-600 group-hover:text-white transition-all duration-500">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-5xl font-black text-slate-900 leading-none tracking-tighter">{stats.totalItems}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-3 flex items-center gap-2 group-hover:text-sky-600 transition-colors">
                Objetos <ChevronRight className="h-3 w-3" />
              </p>
            </div>
          </Card>
        </Link>
        <Link href="/containers" className="group">
          <Card interactive className="flex flex-col gap-4 p-6 rounded-[2rem] bg-white border-purple-100 hover:border-purple-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-purple-100 text-purple-600 shadow-[inset_0_0_10px_rgba(147,51,234,0.1)] group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-500">
              <Box className="h-6 w-6" />
            </div>
            <div>
              <p className="text-5xl font-black text-slate-900 leading-none tracking-tighter">{stats.totalContainers}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-3 flex items-center gap-2 group-hover:text-purple-600 transition-colors">
                Contenedores <ChevronRight className="h-3 w-3" />
              </p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <section className="flex flex-col gap-5">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700 px-2">Acceso Rápido</h2>
        <div className="grid grid-cols-3 gap-4">
          <Link href="/scan" className="group flex flex-col items-center gap-3 rounded-[2.5rem] bg-white p-5 border border-sky-100 active:scale-95 transition-all hover:bg-sky-50 shadow-xl">
            <div className="h-16 w-16 flex items-center justify-center rounded-[1.5rem] bg-sky-600 text-white shadow-xl shadow-sky-600/20 group-hover:scale-110 transition-transform duration-500">
              <QrCode className="h-8 w-8" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-sky-600 transition-colors">Scanner</span>
          </Link>
          <Link href="/search" className="group flex flex-col items-center gap-3 rounded-[2.5rem] bg-white p-5 border border-sky-100 active:scale-95 transition-all hover:bg-sky-50 shadow-xl">
            <div className="h-16 w-16 flex items-center justify-center rounded-[1.5rem] bg-sky-50 border border-sky-100 text-slate-400 group-hover:border-sky-300 group-hover:text-sky-600 transition-all duration-500">
              <Search className="h-8 w-8" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-sky-600 transition-colors">Búsqueda</span>
          </Link>
          <Link href="/locations" className="group flex flex-col items-center gap-3 rounded-[2.5rem] bg-white p-5 border border-sky-100 active:scale-95 transition-all hover:bg-sky-50 shadow-xl">
            <div className="h-16 w-16 flex items-center justify-center rounded-[1.5rem] bg-sky-50 border border-sky-100 text-slate-400 group-hover:border-sky-300 group-hover:text-sky-600 transition-all duration-500">
              <Box className="h-8 w-8" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-sky-600 transition-colors">Mapa</span>
          </Link>
        </div>
      </section>

      {/* Recent Items */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700">Flujo Reciente</h2>
          <Link href="/items/new">
            <Button variant="secondary" className="h-9 px-4 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10">
              <PlusCircle className="h-3.5 w-3.5" /> Indexar Nuevo
            </Button>
          </Link>
        </div>
        <div className="flex flex-col gap-3 min-h-[120px]">
          <AnimatePresence mode="popLayout">
            {recentItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <Link
                  href={`/containers/${item.container_id}`}
                  className="group flex items-center gap-5 rounded-[2.25rem] bg-white p-5 border border-sky-100 hover:border-sky-300 hover:bg-sky-50 transition-all active:scale-[0.98] shadow-md"
                >
                  <div className="h-14 w-14 shrink-0 rounded-[1.25rem] bg-sky-50 flex items-center justify-center border border-sky-100 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    <Package className="h-7 w-7 text-sky-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 truncate text-base leading-tight group-hover:text-sky-600 transition-colors">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-sky-600 font-black uppercase tracking-widest bg-sky-100 px-2 py-0.5 rounded-md border border-sky-200">{item.category || "GENERAL"}</span>
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">#{item.id.slice(0, 4)}</span>
                    </div>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-sky-50 flex items-center justify-center border border-sky-100 group-hover:border-sky-600 group-hover:text-sky-600 text-slate-300 transition-all">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
          {recentItems.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center gap-4 bg-zinc-950/50 rounded-[3rem] border-2 border-dashed border-white/5">
              <div className="h-16 w-16 flex items-center justify-center rounded-[1.5rem] bg-zinc-900 border border-white/5 text-zinc-800 opacity-20">
                <Box className="h-8 w-8" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-zinc-600 font-black uppercase tracking-widest text-[10px]">Cero Registros</p>
                <p className="text-zinc-800 text-sm font-medium italic">Tu inventario digital está esperando.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Premium Banner */}
      <section className="relative overflow-hidden rounded-[3rem] bg-linear-to-br from-sky-400 to-blue-500 p-10 text-white shadow-xl shadow-sky-500/20 group cursor-pointer active:scale-[0.98] transition-all">
        {/* Animated Orbs */}
        <div className="absolute -right-20 -top-20 h-64 w-64 bg-white/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 bg-sky-200/20 rounded-full blur-[100px] animate-pulse transition-transform duration-1000 group-hover:scale-150" />

        <div className="relative flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-white animate-ping" />
            <h3 className="font-black uppercase tracking-[0.3em] text-[10px] text-sky-100">Inteligencia Generativa</h3>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-3xl font-black leading-tight tracking-tight">Consultas Semánticas de Vanguardia</p>
            <p className="text-white/80 text-sm font-medium max-w-sm">Localiza cualquier ítem describiendo su función, no solo su nombre.</p>
          </div>
          <Link href="/search">
            <Button className="w-fit rounded-2xl bg-white text-slate-900 hover:bg-sky-50 px-8 py-4 h-12 text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl">
              Lanzar Magic Search
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
