"use client";

import { useEffect, useState } from "react";
import { containersService } from "@/core/containers";
import { itemsService } from "@/core/items";
import {
  Inbox,
  Package2,
  TrendingUp,
  Search,
  QrCode,
  PlusCircle,
  Bell,
  CheckCircle,
  Package,
  Stars,
  ArrowUpRight,
  Zap,
  LayoutGrid
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { type Item } from "@/entities/item/schema";
import { createClient, getDevUser } from "@/lib/supabase/browser";
import { Spinner } from "@/components/ui/spinner";
import { analyzeRedundancies, type AIInsight } from "@/core/services/aiService";
import { toast } from "sonner";
import { ShieldCheck, AlertCircle, Database } from "lucide-react";
import { SmartImage } from "@/components/shared/SmartImage";
import { seedInitialData } from "@/core/seed";
import Link from "next/link";

const Sparkles = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3L14.5 9.5L21 12L14.5 14.5L12 21L9.5 14.5L3 12L9.5 9.5L12 3Z" fill="currentColor" />
  </svg>
);

import { type User as SupabaseUser } from "@supabase/supabase-js";

export default function Home() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [stats, setStats] = useState({ totalContainers: 0, totalItems: 0, looseItems: 0 });
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [activeLoans, setActiveLoans] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const currentUser = await getDevUser();
        setUser(currentUser);

        const [s, items, loans] = await Promise.all([
          containersService.getStats(),
          itemsService.getAll(),
          itemsService.getActiveLoans()
        ]);
        setStats(s as any);
        setRecentItems(items.slice(0, 5));
        setActiveLoans(loans);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-surface">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 space-y-16 animate-in fade-in duration-700">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-outline-variant/10 pb-12">
        <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                <ShieldCheck className="h-3 w-3" /> Ecosistema Seguro
            </div>
            <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-7xl md:text-8xl font-headline font-bold text-on-surface tracking-tighter leading-[0.9]"
            >
                Smart<span className="text-primary italic">Inventory</span>
            </motion.h1>
            <p className="font-body text-on-surface-variant text-xl max-w-2xl leading-relaxed">
                Visualiza y gestiona tu inventario físico con la precisión de un <span className="text-on-surface font-bold">laboratorio inteligente</span> impulsado por IA.
            </p>
        </div>
        
        <div className="flex gap-4">
            <button className="h-16 w-16 bg-surface-container-low rounded-2xl flex items-center justify-center text-on-surface hover:text-primary transition-all cloud-shadow">
                <Bell className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-4 bg-surface-container-low p-2 pr-6 rounded-2xl cloud-shadow">
                <img 
                  alt="User" 
                  className="w-12 h-12 rounded-xl object-cover" 
                  src={`https://ui-avatars.com/api/?name=${user?.email?.split('@')[0]}&background=005faf&color=fff`} 
                />
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Operador</p>
                    <p className="text-sm font-bold text-on-surface">{user?.email?.split('@')[0]}</p>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Logistical Control */}
        <div className="lg:col-span-8 space-y-12">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: "Objetos Totales", value: stats.totalItems, icon: Package2, color: "text-primary", bg: "bg-primary/5" },
                    { label: "Contenedores", value: stats.totalContainers, icon: Inbox, color: "text-secondary", bg: "bg-secondary/5" },
                    { label: "Objetos Sueltos", value: stats.looseItems, icon: Sparkles, color: "text-tertiary", bg: "bg-tertiary/5" }
                ].map((stat, i) => (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        key={stat.label}
                        className="bg-surface-container-lowest p-8 rounded-[2.5rem] cloud-shadow border border-outline-variant/5 group hover:bg-surface-container transition-all"
                    >
                        <div className={`h-14 w-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                            <stat.icon className="h-7 w-7" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant mb-1">{stat.label}</p>
                        <h3 className="text-4xl font-headline font-bold text-on-surface">{stat.value.toLocaleString()}</h3>
                    </motion.div>
                ))}
            </div>

            {/* AI Auditor Section */}
            <div className="relative group">
                <div className="absolute inset-0 bg-linear-to-r from-primary/10 to-transparent rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <AIInsightsPanel inventory={recentItems} />
            </div>

            {/* Action Hub */}
            <section className="space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-headline font-bold text-on-surface tracking-tight">Acciones del Sistema</h2>
                    <Link href="/inventory" className="text-xs font-black uppercase tracking-widest text-primary hover:underline">Ver Mapa Completo</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    {[
                        { label: "Escanear QR", href: "/scan", icon: QrCode, desc: "Identificación visual", color: "from-primary to-primary-container" },
                        { label: "Búsqueda IA", href: "/search", icon: Sparkles, desc: "Lenguaje natural", color: "from-tertiary to-tertiary-container" },
                        { label: "Nuevo Item", href: "/items/new", icon: PlusCircle, desc: "Registro manual", color: "from-secondary to-secondary-container" }
                    ].map((action) => (
                        <Link href={action.href} key={action.label} className="group">
                            <div className="h-full bg-surface-container-low rounded-[2rem] p-8 flex flex-col items-center text-center gap-4 hover:bg-surface-container-highest transition-all cloud-shadow border border-transparent hover:border-primary/10">
                                <div className={`h-16 w-16 rounded-2xl bg-linear-to-br ${action.color} text-on-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                    <action.icon className="h-8 w-8" />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-on-surface">{action.label}</p>
                                    <p className="text-[10px] text-on-surface-variant font-medium mt-1">{action.desc}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </div>

        {/* Real-time Activity Sidebar */}
        <div className="lg:col-span-4 space-y-12">
            {/* Active Loans */}
            <section className="bg-surface-container-low rounded-[3rem] p-8 border border-outline-variant/5 cloud-shadow flex flex-col gap-8">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-headline font-bold text-on-surface">Préstamos</h3>
                    <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50"></div>
                </div>
                
                <div className="space-y-4">
                    {activeLoans.map((loan) => (
                        <div key={loan.id} className="p-4 bg-surface-container-lowest rounded-2xl flex items-center gap-4 border border-outline-variant/10">
                            <div className="h-10 w-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center">
                                <Package className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-on-surface truncate">{loan.name}</p>
                                <p className="text-[10px] font-black uppercase tracking-tighter text-emerald-600">En uso: {loan.borrowed_by === '4cef6da7-62a7-4855-80a6-27583e387a05' ? 'Personal' : 'Externo'}</p>
                            </div>
                        </div>
                    ))}
                    {activeLoans.length === 0 && (
                        <div className="py-12 text-center opacity-30">
                            <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                            <p className="text-xs font-black uppercase tracking-widest">Inventario Íntegro</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Recent Items / Scans */}
            <section className="space-y-8">
                <h3 className="text-xl font-headline font-bold text-on-surface px-2">Escaneos Recientes</h3>
                <div className="space-y-4">
                    {recentItems.map((item) => (
                        <Link href={`/items/${item.id}`} key={item.id}>
                            <div className="p-4 bg-surface-container-lowest rounded-2xl flex items-center gap-4 hover:bg-surface-container transition-all group border border-outline-variant/5">
                                <div className="h-14 w-14 rounded-xl overflow-hidden bg-surface-container shrink-0">
                                    <SmartImage path={item.photo_path} alt={item.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-[0.2em]">ID: {item.id.slice(0, 6)}</p>
                                    <p className="text-sm font-bold text-on-surface truncate">{item.name}</p>
                                    <p className="text-[10px] text-primary font-bold mt-1 flex items-center gap-1">
                                        <LayoutGrid className="h-3 w-3" />
                                        {(item as any).containers?.label || (item as any).locations?.name || "Directo"}
                                    </p>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-all" />
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Maintenance / Seed */}
            <div className="pt-8">
                <button 
                    onClick={async () => {
                        setSeeding(true);
                        const toastId = toast.loading("Reseteando Ecosistema...");
                        try {
                            await seedInitialData();
                            toast.success("Estructura física restaurada", { id: toastId });
                            window.location.reload();
                        } catch (e) {
                            toast.error("Error en restauración", { id: toastId });
                        } finally {
                            setSeeding(false);
                        }
                    }}
                    className="w-full h-14 bg-on-surface text-surface rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-on-surface/90 transition-all flex items-center justify-center gap-3"
                    disabled={seeding}
                >
                    <Database className="h-4 w-4" />
                    {seeding ? "Procesando..." : "Restaurar Seed Físico"}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}

function AIInsightsPanel({ inventory }: { inventory: Item[] }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const results = await analyzeRedundancies(inventory);
      setInsights(results);
    } catch (e) {
      toast.error("Error en auditoría IA");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-surface-container-low rounded-[3rem] p-10 border border-outline-variant/10 cloud-shadow relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 relative z-10">
        <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-[1.5rem] bg-linear-to-br from-primary to-primary-container text-on-primary flex items-center justify-center shadow-xl">
                <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
                <h3 className="text-2xl font-headline font-bold text-on-surface tracking-tight">Auditoría de IA</h3>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Análisis de Redundancia</p>
            </div>
        </div>
        {!insights.length && (
            <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="h-14 px-10 bg-on-surface text-surface rounded-2xl font-bold text-sm tracking-tight hover:bg-on-surface/90 transition-all flex items-center gap-3 shadow-xl"
            >
                {isAnalyzing ? <Spinner size="sm" className="text-surface" /> : <Zap className="h-5 w-5" />}
                {isAnalyzing ? "Analizando Patrones..." : "Iniciar Auditoría"}
            </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {insights.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10"
          >
            {insights.map((insight, i) => (
              <div key={i} className="bg-surface-container-lowest p-8 rounded-[2.5rem] border border-outline-variant/10 group hover:border-primary/20 transition-all shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <h4 className="font-headline font-bold text-on-surface text-lg">{insight.title}</h4>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6 font-medium">{insight.description}</p>
                <div className="bg-surface-container-low p-5 rounded-2xl border border-primary/5">
                  <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Optimización Sugerida</p>
                  <p className="text-sm font-bold text-on-surface leading-tight">{insight.recommendation}</p>
                </div>
              </div>
            ))}
            <button 
              onClick={() => setInsights([])}
              className="md:col-span-2 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.4em] hover:text-primary transition-all text-center"
            >
              [ Cerrar Reporte de IA ]
            </button>
          </motion.div>
        ) : !isAnalyzing && (
          <div className="text-center py-6 opacity-40 italic font-medium relative z-10">
            <p className="text-on-surface-variant">El motor cognitivo está listo para auditar tu inventario.</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
