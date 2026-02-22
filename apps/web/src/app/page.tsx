"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Scan, Box, Package, History, TrendingUp, Loader2, LogOut } from "lucide-react";
import Link from "next/link";
import { containersService } from "@/lib/data/containers";
import { itemsService } from "@/lib/data/items";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [containers, setContainers] = useState<any[]>([]);
  const [itemCount, setItemCount] = useState<number | string>("...");
  const [deviceCount, setDeviceCount] = useState<number | string>("...");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUser({ email: 'mario@smartinventory.local', id: '00000000-0000-0000-0000-000000000000' });
      } else {
        setUser(user);
      }

      try {
        const [containersData, itemsData] = await Promise.all([
          containersService.getAll(),
          itemsService.getAll()
        ]);
        setContainers(containersData || []);
        setItemCount(itemsData ? itemsData.length : 0);
        setDeviceCount(itemsData ? itemsData.filter((i: any) => i.item_type === 'device').length : 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const stats = [
    { label: "Cajas", value: containers.length, icon: Box, color: "text-blue-500" },
    { label: "Items", value: itemCount, icon: Package, color: "text-purple-500" },
    { label: "Dispositivos", value: deviceCount, icon: TrendingUp, color: "text-emerald-500" },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-4xl font-bold tracking-tight">
            Hola, {user?.email?.split('@')[0] || 'Usuario'}
          </h2>
          <p className="text-zinc-500">Tienes {containers.length} cajas bajo control.</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-500 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      {/* Quick Action (Mobile Only) */}
      <div className="lg:hidden">
        <Link
          href="/scan"
          className="flex items-center gap-4 rounded-3xl bg-blue-600 p-6 shadow-xl shadow-blue-500/30 transition-all active:scale-95"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
            <Scan className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">Escanear Caja</p>
            <p className="text-sm text-white/70">Encuentra o agrega items al instante</p>
          </div>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card flex flex-col gap-2">
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-zinc-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Containers */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-bold">Cajas Recientes</h3>
          <Link href="/containers" className="text-sm font-medium text-blue-500">Ver todas</Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {containers.map((container) => (
            <Link key={container.id} href={`/containers/${container.id}`} className="glass-card group flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 transition-colors group-hover:bg-blue-600/20">
                <Box className="h-6 w-6 text-zinc-600 transition-colors group-hover:text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="font-bold">{container.label}</p>
                <p className="text-xs text-zinc-500">{(container.locations as any)?.name || 'Sin ubicación'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">...</p>
                <p className="text-[10px] text-zinc-600">{mounted ? new Date(container.created_at).toLocaleDateString() : '...'}</p>
              </div>
            </Link>
          ))}
          {containers.length === 0 && (
            <div className="md:col-span-2 py-10 text-center border-2 border-dashed border-zinc-900 rounded-3xl">
              <p className="text-zinc-600 italic">No hay cajas aún. Crea la primera.</p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 px-2">
          <History className="h-5 w-5 text-zinc-500" />
          <h3 className="text-xl font-bold">Actividad Reciente</h3>
        </div>
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 rounded-2xl border border-white/5 bg-zinc-950/50 p-4">
              <div className="h-10 w-10 rounded-lg bg-zinc-900" />
              <div className="flex-1">
                <p className="text-sm font-medium">Cable HDMI 2.1 <span className="text-zinc-500">agregado a</span> Caja #4</p>
                <p className="text-[10px] text-zinc-600">Hace 15 minutos</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
