import { useState, useEffect } from 'react';
import { 
  Home, Search, Box, Scan, MoreHorizontal, MapPin,
  Package2, BarChart3, ChevronRight, LogOut, PlusCircle,
  QrCode, Plus, Sparkles, Zap, Trash2,
  User, Bell, HelpCircle, Database, Printer, Shield,
  Camera, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { RobustScanner } from '@/components/inventory/RobustScanner';
import { containersService } from '@/core/containers';
import { itemsService } from '@/core/items';
import { createClient, getDevUser } from '@/lib/supabase/browser';
import { InventoryPage } from '@/components/inventory/InventoryPage';
import type { Container } from '@/core/containers';

type Page = 'home' | 'search' | 'scan' | 'containers' | 'locations' | 'more';

/* ───────────────────────────────────────────
   SIDEBAR (Desktop — lg+)
   ─────────────────────────────────────────── */
function Sidebar({ active, onChange }: { active: Page; onChange: (p: Page) => void }) {
  const navItems: { label: string; icon: any; page: Page }[] = [
    { label: 'Dashboard',           icon: Home,          page: 'home' },
    { label: 'Búsqueda Semántica',  icon: Search,        page: 'search' },
    { label: 'Mis Lugares',         icon: MapPin,        page: 'locations' },
    { label: 'Inventario de Cajas', icon: Box,           page: 'containers' },
    { label: 'Configuración',       icon: MoreHorizontal,page: 'more' },
  ];

  return (
    <aside className="fixed left-0 top-0 z-[100] hidden h-screen w-72 flex-col border-r border-sky-100 bg-white px-6 py-8 lg:flex">
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 shadow-lg shadow-sky-500/20">
          <Package2 className="h-6 w-6 text-white" />
        </div>
        <span className="text-xl font-black tracking-tight text-slate-900">SmartInventory</span>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.page;
          return (
            <button
              key={item.page}
              onClick={() => onChange(item.page)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 font-bold transition-all hover:bg-sky-50 text-left cursor-pointer group',
                isActive ? 'bg-sky-50 text-sky-600 border border-sky-100 shadow-sm' : 'text-slate-500'
              )}
            >
              <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-sky-600" : "text-slate-400 group-hover:text-sky-500")} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <button
        onClick={() => onChange('scan')}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 py-4 font-black text-white shadow-xl shadow-sky-500/20 transition-all hover:bg-sky-500 active:scale-95 cursor-pointer border-none outline-none"
      >
        <Scan className="h-5 w-5" />
        Escanear QR
      </button>
    </aside>
  );
}

/* ───────────────────────────────────────────
   BOTTOM NAV (Mobile — sm/md)
   ─────────────────────────────────────────── */
function BottomNav({ active, onChange }: { active: Page; onChange: (p: Page) => void }) {
  const navItems: { label: string; icon: any; page: Page; primary?: boolean }[] = [
    { label: 'Inicio',   icon: Home,           page: 'home' },
    { label: 'Lugares',  icon: MapPin,         page: 'locations' },
    { label: 'Escanear', icon: Scan,           page: 'scan', primary: true },
    { label: 'Cajas',    icon: Box,            page: 'containers' },
    { label: 'Más',      icon: MoreHorizontal, page: 'more' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-20 border-t border-sky-100 bg-white/80 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex h-full max-w-md items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.page;

          if (item.primary) {
            return (
              <button
                key={item.page}
                onClick={() => onChange(item.page)}
                className="relative -top-6 flex h-16 w-16 items-center justify-center rounded-full bg-sky-600 shadow-xl shadow-sky-500/40 transition-transform active:scale-90 cursor-pointer border-4 border-sky-50"
              >
                <Icon className="h-8 w-8 text-white" />
              </button>
            );
          }

          return (
            <button
              key={item.page}
              onClick={() => onChange(item.page)}
              className={cn(
                'flex flex-col items-center gap-1 transition-all active:scale-95 cursor-pointer',
                isActive ? 'text-sky-600' : 'text-slate-400'
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ───────────────────────────────────────────
   PAGE: HOME (Dashboard)
   ─────────────────────────────────────────── */
function HomePage({ navigate }: { navigate: (p: Page) => void }) {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ totalContainers: 0, totalItems: 0 });
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;

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
          <Button variant="outline" className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm bg-white border-sky-100 text-sky-600" onClick={() => itemsService.exportToCSV()}>
            Descargar DB
          </Button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-5">
        <button onClick={() => navigate('containers')} className="group text-left cursor-pointer focus:outline-none">
          <Card interactive className="flex flex-col gap-4 p-6 rounded-[2rem] border-sky-100 bg-white shadow-sm hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-500">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-sky-50 text-sky-600 group-hover:scale-110 group-hover:bg-sky-600 group-hover:text-white transition-all duration-500 border border-sky-100">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-5xl font-black text-slate-900 leading-none tracking-tighter">{stats.totalItems}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-3 flex items-center gap-2 group-hover:text-sky-600 transition-colors">
                Objetos <ChevronRight className="h-3 w-3" />
              </p>
            </div>
          </Card>
        </button>
        <button onClick={() => navigate('containers')} className="group text-left cursor-pointer focus:outline-none">
          <Card interactive className="flex flex-col gap-4 p-6 rounded-[2rem] border-sky-100 bg-white shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-500">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-indigo-50 text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 border border-indigo-100">
              <Box className="h-6 w-6" />
            </div>
            <div>
              <p className="text-5xl font-black text-slate-900 leading-none tracking-tighter">{stats.totalContainers}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-3 flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                Cajas <ChevronRight className="h-3 w-3" />
              </p>
            </div>
          </Card>
        </button>
      </div>

      {/* Quick Actions */}
      <section className="flex flex-col gap-5">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2">Acceso Rápido</h2>
        <div className="grid grid-cols-4 gap-3">
          <button onClick={() => navigate('scan')} className="group flex flex-col items-center gap-3 rounded-[2rem] bg-white p-4 border border-sky-100 active:scale-95 transition-all hover:bg-sky-50 shadow-sm cursor-pointer">
            <div className="h-14 w-14 flex items-center justify-center rounded-[1.25rem] bg-sky-600 text-white shadow-lg shadow-sky-600/30 group-hover:scale-110 transition-transform duration-500">
              <QrCode className="h-7 w-7" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-sky-600 transition-colors">Scanner</span>
          </button>
          <button onClick={() => navigate('search')} className="group flex flex-col items-center gap-3 rounded-[2rem] bg-white p-4 border border-sky-100 active:scale-95 transition-all hover:bg-sky-50 shadow-sm cursor-pointer">
            <div className="h-14 w-14 flex items-center justify-center rounded-[1.25rem] bg-white border border-sky-100 text-slate-400 group-hover:border-sky-500/30 group-hover:text-sky-600 transition-all duration-500 shadow-sm">
              <Search className="h-7 w-7" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-sky-600 transition-colors">Buscar</span>
          </button>
          <button onClick={() => navigate('locations')} className="group flex flex-col items-center gap-3 rounded-[2rem] bg-white p-4 border border-sky-100 active:scale-95 transition-all hover:bg-sky-50 shadow-sm cursor-pointer">
            <div className="h-14 w-14 flex items-center justify-center rounded-[1.25rem] bg-white border border-sky-100 text-slate-400 group-hover:border-sky-500/30 group-hover:text-sky-600 transition-all duration-500 shadow-sm">
              <Box className="h-7 w-7" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-sky-600 transition-colors">Mapa</span>
          </button>
          <button onClick={() => navigate('scan')} className="group flex flex-col items-center gap-3 rounded-[2rem] bg-white p-4 border border-sky-100 active:scale-95 transition-all hover:bg-sky-50 shadow-sm cursor-pointer">
            <div className="h-14 w-14 flex items-center justify-center rounded-[1.25rem] bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-500">
              <Plus className="h-7 w-7" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-emerald-600 transition-colors">Nuevo Item</span>
          </button>
        </div>
      </section>

      {/* Recent Items */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Flujo Reciente</h2>
          <Button variant="ghost" className="h-9 px-4 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-sky-600 hover:bg-sky-50" onClick={() => navigate('scan')}>
            Ver Todo <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex flex-col gap-3 min-h-[120px]">
          <AnimatePresence mode="popLayout">
            {recentItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <div className="group flex items-center gap-5 rounded-[2.25rem] bg-white p-5 border border-sky-100 hover:border-sky-300 hover:bg-sky-50 transition-all active:scale-[0.98] shadow-sm hover:shadow-lg cursor-pointer">
                  <div className="h-14 w-14 shrink-0 rounded-[1.25rem] bg-sky-50 flex items-center justify-center border border-sky-100 shadow-inner group-hover:bg-sky-600 group-hover:text-white transition-all">
                    <Package className="h-7 w-7 text-sky-400 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 truncate text-base leading-tight group-hover:text-sky-600 transition-colors">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">{item.category || 'GENERAL'}</span>
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">#{item.id.slice(0, 4)}</span>
                    </div>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border border-sky-100 group-hover:border-sky-300 group-hover:text-sky-600 text-slate-300 transition-all">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {recentItems.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center gap-4 bg-white rounded-[3rem] border border-sky-100 shadow-sm">
              <div className="h-16 w-16 flex items-center justify-center rounded-[1.5rem] bg-sky-50 border border-sky-100 text-sky-200">
                <Box className="h-8 w-8" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Cero Registros</p>
                <p className="text-slate-300 text-sm font-medium italic">Tu inventario digital está esperando.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Premium Banner */}
      <section className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-sky-600 via-sky-700 to-indigo-800 p-10 text-white shadow-2xl shadow-sky-500/30 group cursor-pointer active:scale-[0.98] transition-all" onClick={() => navigate('search')}>
        <div className="absolute -right-20 -top-20 h-64 w-64 bg-white/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 bg-sky-400/20 rounded-full blur-[100px] animate-pulse transition-transform duration-1000 group-hover:scale-150" />
        <div className="relative flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-white animate-ping" />
            <h3 className="font-black uppercase tracking-[0.3em] text-[10px] text-sky-100">Inteligencia Generativa</h3>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-3xl font-black leading-tight tracking-tight">Consultas Semánticas de Vanguardia</p>
            <p className="text-sky-100/80 text-sm font-medium max-w-sm">Localiza cualquier ítem describiendo su función, no solo su nombre.</p>
          </div>
          <Button className="w-fit rounded-2xl bg-white text-sky-700 hover:bg-sky-50 px-8 py-4 h-12 text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl border-none font-bold">
            Lanzar Magic Search
          </Button>
        </div>
      </section>
    </div>
  );
}

/* ───────────────────────────────────────────
   PAGE: SEARCH
   ─────────────────────────────────────────── */
function SearchPage() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'hybrid' | 'text'>('hybrid');
  const [results, setResults] = useState<any[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setIsPending(true);
    setError(null);
    try {
      // Import dynamically to avoid ESM issues
      const { hybridSearch, textSearch } = await import('@/core/ai');
      const data = mode === 'hybrid' ? await hybridSearch(query) : await textSearch(query);
      setResults(data as any[]);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? 'Error en la búsqueda. Intenta de nuevo.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 pb-20 max-w-3xl mx-auto">
      <form onSubmit={handleSearch} className="relative group">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-600 transition-colors" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="¿Qué estás buscando? (ej: cables de video)"
          className="w-full pl-12 pr-14 h-14 bg-white rounded-[1.5rem] border border-sky-100 text-slate-900 font-bold focus:border-sky-500 focus:outline-none transition-all placeholder:text-slate-300 shadow-sm"
          autoFocus
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {isPending ? (
            <div className="p-2 text-sky-600"><Spinner size="sm" /></div>
          ) : (
            <Button type="submit" variant="ghost" className="h-10 w-10 p-0 rounded-xl text-sky-600 hover:bg-sky-50 cursor-pointer">
              <Sparkles className="h-5 w-5" />
            </Button>
          )}
        </div>
      </form>

      {/* Mode Toggle */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-1">Motor de Búsqueda</h2>
          <span className="text-[10px] font-bold text-sky-600 bg-white px-2 py-0.5 rounded-md border border-sky-100">
            {mode === 'hybrid' ? 'IA + Palabras Clave' : 'Coincidencia Exacta'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 p-1 bg-white rounded-[1.5rem] border border-sky-100 shadow-sm">
          <button onClick={() => setMode('hybrid')} className={cn(
            'flex items-center justify-center gap-2 rounded-[1.25rem] py-3 text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer border-none outline-none',
            mode === 'hybrid' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' : 'text-slate-400 hover:text-sky-600'
          )}>
            <Sparkles className="h-3.5 w-3.5" /> Híbrida (IA)
          </button>
          <button onClick={() => setMode('text')} className={cn(
            'flex items-center justify-center gap-2 rounded-[1.25rem] py-3 text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer border-none outline-none',
            mode === 'text' ? 'bg-sky-100 text-sky-700 border border-sky-200' : 'text-slate-400 hover:text-sky-600'
          )}>
            <Zap className="h-3.5 w-3.5" /> Clásica
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-100">{error}</div>}

      {/* Results */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 px-1">
          {isPending ? 'Buscando...' : results.length > 0 ? `${results.length} resultado${results.length !== 1 ? 's' : ''}` : query ? 'Sin resultados' : 'Tu Inventario'}
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {results.map((item: any) => (
            <Card key={item.id} interactive className="flex flex-col gap-3 p-4 rounded-[1.75rem]">
              <div className="h-20 w-full rounded-2xl bg-zinc-900 flex items-center justify-center border border-white/5">
                <Package className="h-8 w-8 text-zinc-700" />
              </div>
              <div className="min-w-0">
                <p className="font-black text-white text-sm truncate">{item.name}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">{item.category || 'General'}</p>
              </div>
              {mode === 'hybrid' && (
                <span className="text-[8px] font-mono text-zinc-700 text-right">Match: {Math.round((item.score_combined || 0) * 100)}%</span>
              )}
            </Card>
          ))}
        </div>
        {!isPending && query && results.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-zinc-950 flex items-center justify-center border border-white/5">
              <Search className="h-8 w-8 text-zinc-800" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-zinc-500 text-sm font-medium">No encontramos nada que coincida con &quot;{query}&quot;</p>
              <p className="text-zinc-700 text-xs">Intenta con términos más generales.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────
   PAGE: SCAN (Camera Scanner)
   ─────────────────────────────────────────── */
function ScanPage() {
  const [showScanner, setShowScanner] = useState(true);

  return (
    <div className="flex flex-col gap-6 items-center justify-center min-h-[60vh]">
      {showScanner ? (
        <RobustScanner
          onItemAdded={() => setShowScanner(false)}
          onClose={() => setShowScanner(false)}
        />
      ) : (
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="h-24 w-24 rounded-full bg-sky-50 flex items-center justify-center border border-sky-100">
            <Camera className="h-12 w-12 text-sky-600" />
          </div>
          <div>
            <p className="text-xl font-black text-slate-900">¡Captura Exitosa!</p>
            <p className="text-slate-400 text-sm mt-1">El item fue registrado físicamente.</p>
          </div>
          <Button onClick={() => setShowScanner(true)} className="rounded-2xl px-8 py-4 h-14 bg-sky-600 text-white hover:bg-sky-500 shadow-xl shadow-sky-600/20 border-none cursor-pointer font-bold">
            <Plus className="h-5 w-5 mr-2" /> Escanear Otro
          </Button>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────
   PAGE: CONTAINERS (DEPRECATED -> Handled by InventoryPage)
   ─────────────────────────────────────────── */

/* ───────────────────────────────────────────
   PAGE: LOCATIONS
   ─────────────────────────────────────────── */
function LocationsPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  async function loadLocations() {
    try {
      const { locationsService } = await import('@/core/locations');
      const data = await locationsService.getAll();
      setLocations(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadLocations(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const { locationsService } = await import('@/core/locations');
      await locationsService.create({ name: newName, parent_id: selectedParentId || undefined });
      setNewName('');
      setSelectedParentId(null);
      loadLocations();
    } catch (e) { console.error(e); }
  }

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="flex flex-col gap-10 max-w-[60rem] mx-auto pb-40">
      <header className="flex flex-col gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-sky-50 border border-sky-100 mb-2">
          <MapPin className="h-6 w-6 text-sky-600" />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Ubicaciones</h1>
        <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Jerarquía Visual de tu Almacén</p>
      </header>

      <Card variant="secondary" className="border-sky-100 bg-white">
        <form onSubmit={handleCreate} className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Crear Nueva Ubicación</label>
            <div className="flex gap-3">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Ej. Habitación Principal, Estante A..."
                className="flex-1 h-14 bg-sky-50 rounded-2xl border border-sky-100 px-4 text-slate-900 font-bold focus:border-sky-500 focus:outline-none transition-all placeholder:text-slate-300"
              />
              <Button type="submit" className="h-14 px-8 rounded-2xl bg-sky-600 text-white hover:bg-sky-500 shadow-xl shadow-sky-600/20 border-none cursor-pointer font-bold">
                <Plus className="h-5 w-5 mr-2" /> Agregar
              </Button>
            </div>
          </div>
          {locations.length > 0 && (
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Jerarquía / Nivel Superior</label>
              <select
                value={selectedParentId || ''}
                onChange={e => setSelectedParentId(e.target.value || null)}
                className="w-full rounded-2xl bg-zinc-950/50 border border-white/5 px-4 h-14 text-white font-bold focus:border-blue-500 focus:outline-none transition-all appearance-none"
              >
                <option value="">Sin Padre (Nivel Raíz)</option>
                {locations.map((l: any) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          )}
        </form>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 px-4">Mapa Estructural</h2>
        <div className="flex flex-col gap-1 p-2 bg-zinc-950 rounded-[2rem] border border-white/5">
          {locations.map((loc: any) => (
            <div key={loc.id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-500">
                <MapPin className="h-4 w-4" />
              </div>
              <span className="flex-1 font-bold text-zinc-100 group-hover:text-blue-500 transition-colors">{loc.name}</span>
              <Button variant="ghost" className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {locations.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <MapPin className="h-10 w-10 text-zinc-800 opacity-20" />
              <p className="text-zinc-600 italic font-medium">No has creado ubicaciones todavía.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────
   PAGE: MORE (Settings)
   ─────────────────────────────────────────── */
function MorePage({ navigate }: { navigate: (p: Page) => void }) {
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    getDevUser().then(u => setUser(u));
  }, []);

  const menuItems = [
    { label: 'Perfil', icon: User, desc: 'Gestionar tus datos personales' },
    { label: 'Centro de Impresión', icon: Printer, desc: 'Generar etiquetas QR para cajas' },
    { label: 'Ubicaciones', icon: MapPin, desc: 'Gestionar habitaciones y estantes', action: () => navigate('locations') },
    { label: 'Notificaciones', icon: Bell, desc: 'Alertas de stock y préstamos' },
    { label: 'Sincronización Cloud', icon: Database, desc: 'Estado de la base de datos', status: 'Conectado' },
    { label: 'Ayuda y Soporte', icon: HelpCircle, desc: 'Preguntas frecuentes' },
  ];

  return (
    <div className="flex flex-col gap-8 pb-10 max-w-2xl mx-auto">
      <h1 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">Configuración</h1>

      {/* User Card */}
      <Card className="flex items-center gap-4 bg-white border-sky-100 shadow-sm p-6 rounded-[2.5rem]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-600 text-2xl font-black text-white shadow-xl shadow-sky-600/20">
          {user?.email?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1">
          <p className="font-black text-lg text-slate-900">{user?.email?.split('@')[0] || 'Usuario'}</p>
          <p className="text-sm text-slate-400">{user?.email}</p>
        </div>
        <div className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 border border-emerald-100">
          Pro Plan
        </div>
      </Card>

      {/* Menu */}
      <div className="flex flex-col gap-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} interactive className="flex items-center gap-4 group cursor-pointer bg-white border-sky-50 shadow-sm hover:border-sky-200 hover:bg-sky-50/30 p-4 rounded-[2rem]" onClick={item.action}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-400 group-hover:bg-sky-600 group-hover:text-white transition-all duration-300 border border-sky-100">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-black text-slate-900 text-sm">{item.label}</p>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{item.desc}</p>
              </div>
              {item.status ? (
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{item.status}</span>
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-sky-600 transition-colors" />
              )}
            </Card>
          );
        })}
      </div>

      {/* Logout */}
      <div className="flex flex-col gap-4 mt-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-300 px-4">Sesión</h3>
        <Card interactive className="flex items-center gap-4 text-rose-600 bg-rose-50/30 border-rose-100 hover:bg-rose-50 transition-all cursor-pointer p-4 rounded-[2rem]" onClick={async () => {
          await supabase.auth.signOut();
          window.location.reload();
        }}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 border border-rose-200 group-hover:bg-rose-600 group-hover:text-white transition-all">
            <LogOut className="h-5 w-5" />
          </div>
          <p className="font-black">Cerrar Sesión</p>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">SmartInventory v2.5.0 — Cloud Engine</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN APP — Orchestrator
   ═══════════════════════════════════════════ */
export default function App() {
  const [activePage, setActivePage] = useState<Page>('home');

  const navigate = (page: Page) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (activePage) {
      case 'home':       return <HomePage navigate={navigate} />;
      case 'search':     return <SearchPage />;
      case 'scan':       return <ScanPage />;
      case 'containers': return <InventoryPage />;
      case 'locations':  return <LocationsPage />;
      case 'more':       return <MorePage navigate={navigate} />;
      default:           return <HomePage navigate={navigate} />;
    }
  };

  return (
    <>
      <Sidebar active={activePage} onChange={navigate} />
      <main className="relative flex min-h-screen flex-col lg:pl-72 pb-24 lg:pb-0 bg-sky-50">
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <BottomNav active={activePage} onChange={navigate} />
    </>
  );
}
