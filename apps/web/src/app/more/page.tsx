"use client";

import { createClient } from "@/lib/supabase/browser";
import { ChevronLeft, User, Bell, Shield, HelpCircle, LogOut, ChevronRight, Laptop, MapPin, Database } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function MorePage() {
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
    };

    const menuItems = [
        { label: "Perfil", icon: User, desc: "Gestionar tus datos personales" },
        { label: "Ubicaciones", icon: MapPin, desc: "Gestionar habitaciones y estantes", href: "/locations" },
        { label: "Notificaciones", icon: Bell, desc: "Alertas de stock y préstamos" },
        { label: "Sincronización Cloud", icon: Database, desc: "Estado de la base de datos", status: "Conectado" },
        { label: "Ayuda y Soporte", icon: HelpCircle, desc: "Preguntas frecuentes" },
    ];

    return (
        <div className="flex flex-col gap-8 pb-10">
            <header className="flex items-center gap-4">
                <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400">
                    <ChevronLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-2xl font-bold text-white">Configuración</h1>
            </header>

            {/* User Card */}
            <div className="glass-card flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
                    {user?.email?.[0].toUpperCase() || "?"}
                </div>
                <div className="flex-1">
                    <p className="font-bold text-lg">{user?.email?.split('@')[0] || "Usuario"}</p>
                    <p className="text-sm text-zinc-500">{user?.email}</p>
                </div>
                <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-tight text-emerald-500">
                    Pro Plan
                </div>
            </div>

            {/* Menu List */}
            <div className="flex flex-col gap-2">
                {menuItems.map((item) => (
                    <Link key={item.label} href={item.href || "#"} className="glass-card flex items-center gap-4 group">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-500 group-hover:bg-blue-600/10 group-hover:text-blue-500 transition-colors">
                            <item.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-white">{item.label}</p>
                            <p className="text-[10px] text-zinc-600">{item.desc}</p>
                        </div>
                        {item.status ? (
                            <span className="text-[10px] font-bold text-emerald-500 uppercase">{item.status}</span>
                        ) : (
                            <ChevronRight className="h-4 w-4 text-zinc-700" />
                        )}
                    </Link>
                ))}
            </div>

            {/* Danger Zone */}
            <div className="flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-700 px-2">Sesión</h3>
                <button
                    onClick={handleSignOut}
                    className="glass-card flex items-center gap-4 text-red-500 hover:bg-red-500/5 hover:border-red-500/20"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                        <LogOut className="h-5 w-5" />
                    </div>
                    <p className="font-bold">Cerrar Sesión</p>
                </button>
            </div>

            {/* Footer */}
            <div className="mt-4 text-center">
                <p className="text-[10px] text-zinc-700 uppercase tracking-tighter">SmartInventory v1.0.4 — Build 2024.02</p>
            </div>
        </div>
    );
}
