"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Box, Scan, MoreHorizontal, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { label: "Inicio", icon: Home, href: "/" },
    { label: "Lugares", icon: Search, href: "/locations" },
    { label: "Escanear", icon: Scan, href: "/scan", primary: true },
    { label: "Cajas", icon: Box, href: "/containers" },
    { label: "Más", icon: MoreHorizontal, href: "/more" },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-20 border-t border-white/10 bg-black/80 backdrop-blur-xl lg:hidden">
            <div className="mx-auto flex h-full max-w-md items-center justify-around px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    if (item.primary) {
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="relative -top-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 shadow-lg shadow-blue-500/40 transition-transform active:scale-90"
                            >
                                <Icon className="h-8 w-8 text-white" />
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center gap-1 transition-all active:scale-95",
                                isActive ? "text-blue-500" : "text-zinc-500"
                            )}
                        >
                            <Icon className="h-6 w-6" />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
