"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  MapPin, 
  Package2, 
  Inbox, 
  Search, 
  QrCode, 
  BarChart3, 
  Settings, 
  HelpCircle, 
  LogOut,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/browser";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Ubicaciones", icon: MapPin, href: "/locations" },
  { label: "Contenedores", icon: Inbox, href: "/containers" },
  { label: "Inventario", icon: Package2, href: "/inventory" },
  { label: "Búsqueda", icon: Search, href: "/search" },
  { label: "Escanear", icon: QrCode, href: "/scan" },
  { label: "Análisis", icon: BarChart3, href: "/analytics" },
  { label: "Ajustes", icon: Settings, href: "/more" },
];

export function Sidebar() {
  const pathname = usePathname();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-72 flex-col bg-surface-container-low border-r border-outline-variant/10 px-6 py-8 lg:flex">
      <div className="mb-10 flex flex-col gap-1 px-2">
        <h1 className="font-headline text-xl font-bold tracking-tight text-on-surface">SmartInventory</h1>
        <p className="font-body text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/70">Crystalline Logic</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all active:scale-95",
                isActive 
                  ? "bg-gradient-to-br from-primary to-primary-container text-white shadow-lg shadow-blue-500/20" 
                  : "text-on-surface-variant hover:bg-surface-container hover:translate-x-1"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-on-surface-variant")} />
              <span className="text-sm font-body">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4 pt-4 border-t border-outline-variant/10">
        <Link href="/scan">
          <button className="w-full py-3 bg-gradient-to-br from-primary to-primary-container text-white rounded-full font-body font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex justify-center items-center gap-2">
            <QrCode className="h-4 w-4" />
            Iniciar Escáner
          </button>
        </Link>
        <div className="space-y-1">
          <Link 
            href="/help"
            className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container rounded-xl font-body text-sm font-medium transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            Ayuda
          </Link>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container hover:text-error rounded-xl font-body text-sm font-medium transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </aside>
  );
}
