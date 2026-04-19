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
  LogOut 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/browser";

const menuItems = [
  { icon: LayoutDashboard, label: "Panel de Control", href: "/" },
  { icon: MapPin, label: "Ubicaciones", href: "/locations" },
  { icon: Inbox, label: "Contenedores", href: "/containers" },
  { icon: Package2, label: "Inventario", href: "/inventory" },
  { icon: Search, label: "Búsqueda", href: "/search" },
  { icon: QrCode, label: "Escanear", href: "/scan" },
  { icon: BarChart3, label: "Análisis", href: "/analytics" },
  { icon: Settings, label: "Ajustes", href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <nav className="h-screen w-64 fixed left-0 top-0 bg-surface-container-low hidden md:flex flex-col p-6 gap-2 z-40 border-r border-outline-variant/10">
      <div className="mb-8 pl-4">
        <h1 className="font-headline font-extrabold text-lg text-on-surface tracking-tight">SmartInventory</h1>
        <p className="font-body text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/70">Crystalline Logic</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-95 font-body text-sm font-medium",
                isActive 
                  ? "bg-gradient-to-br from-primary to-primary-container text-white shadow-lg shadow-blue-500/20" 
                  : "text-on-surface-variant hover:bg-surface-container hover:translate-x-1"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-on-surface-variant")} />
              {item.label}
            </Link>
          );
        })}
      </div>

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
    </nav>
  );
}
