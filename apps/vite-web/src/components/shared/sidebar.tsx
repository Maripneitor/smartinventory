"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Box, Scan, MoreHorizontal, Home, Package2, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { label: "Dashboard", icon: Home, href: "/" },
    { label: "Búsqueda Semántica", icon: Search, href: "/search" },
    { label: "Mis Lugares", icon: Package2, href: "/locations" },
    { label: "Inventario de Cajas", icon: Box, href: "/containers" },
    { label: "Centro de Impresión", icon: Printer, href: "/labels" },
    { label: "Configuración", icon: MoreHorizontal, href: "/more" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-100 hidden h-screen w-72 flex-col border-r border-white/10 bg-zinc-950 px-6 py-8 lg:flex">
            <div className="mb-10 flex items-center gap-3 px-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                    <Package2 className="h-6 w-6 text-white" />
                </div>
                <span className="font-display text-xl font-bold tracking-tight">SmartInventory</span>
            </div>

            <nav className="flex flex-1 flex-col gap-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all hover:bg-white/5",
                                isActive ? "bg-white/10 text-white" : "text-zinc-400"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto">
                <Link
                    href="/scan"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500 active:scale-95"
                >
                    <Scan className="h-5 w-5" />
                    Escanear QR
                </Link>
            </div>
        </aside>
    );
}
