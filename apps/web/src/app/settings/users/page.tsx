"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
    Users, 
    Search, 
    UserPlus, 
    MoreHorizontal, 
    ShieldCheck, 
    ShieldAlert, 
    ChevronLeft,
    Filter,
    Download,
    Mail,
    Calendar
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const MOCK_USERS = [
    { id: "1", name: "Mario Efrain", email: "mario@example.com", role: "Admin", status: "active", joined: "2026-03-15" },
    { id: "2", name: "Ana Garcia", email: "ana@example.com", role: "Editor", status: "active", joined: "2026-03-20" },
    { id: "3", name: "Carlos Ruiz", email: "carlos@example.com", role: "Viewer", status: "pending", joined: "2026-04-01" },
    { id: "4", name: "Elena Sanz", email: "elena@example.com", role: "Editor", status: "active", joined: "2026-04-05" },
];

export default function UserManagement() {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="max-w-6xl mx-auto py-10 px-4 space-y-12">
            {/* Header Editorial */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                    <Link 
                        href="/" 
                        className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-xs font-black uppercase tracking-widest"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Ajustes del Sistema
                    </Link>
                    <motion.h1 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-5xl md:text-6xl font-headline font-bold text-on-surface tracking-tighter"
                    >
                        Gestión de <span className="text-primary italic">Equipos</span>
                    </motion.h1>
                    <p className="text-on-surface-variant font-body text-lg max-w-xl leading-relaxed">
                        Controla el acceso, asigna roles y supervisa la actividad de los colaboradores en tu inventario inteligente.
                    </p>
                </div>
                
                <div className="flex gap-4">
                    <Button variant="secondary" className="h-14 px-6 rounded-2xl bg-surface-container-low text-on-surface font-bold border-none shadow-sm">
                        <Download className="h-5 w-5 mr-2" />
                        Exportar
                    </Button>
                    <Button className="h-14 px-8 rounded-2xl bg-linear-to-r from-primary to-primary-container text-on-primary font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95">
                        <UserPlus className="h-5 w-5 mr-2" />
                        Invitar Miembro
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="space-y-6">
                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:max-w-md group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                        <Input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar colaboradores por nombre o email..."
                            className="h-14 pl-14 pr-6 rounded-2xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        />
                    </div>
                    <Button variant="ghost" className="h-14 px-6 rounded-2xl text-on-surface-variant font-black text-xs uppercase tracking-widest hover:bg-surface-container">
                        <Filter className="h-5 w-5 mr-2" />
                        Filtros Avanzados
                    </Button>
                </div>

                {/* Users Table / Grid */}
                <Card className="border-none bg-surface-container-low cloud-shadow rounded-[3rem] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-outline-variant/10">
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Colaborador</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Rol del Sistema</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Estado</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Unión</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/5">
                                {MOCK_USERS.map((user) => (
                                    <tr key={user.id} className="hover:bg-surface-container transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary font-black shadow-sm group-hover:scale-110 transition-transform">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-headline font-bold text-on-surface text-base">{user.name}</p>
                                                    <p className="text-xs text-on-surface-variant font-medium flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                {user.role === "Admin" ? (
                                                    <ShieldCheck className="h-4 w-4 text-primary" />
                                                ) : (
                                                    <ShieldCheck className="h-4 w-4 text-secondary/60" />
                                                )}
                                                <span className="text-sm font-bold text-on-surface">{user.role}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                user.status === "active" 
                                                ? "bg-primary/10 text-primary" 
                                                : "bg-on-surface-variant/10 text-on-surface-variant"
                                            }`}>
                                                {user.status === "active" ? "Activo" : "Pendiente"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-on-surface-variant">
                                                <Calendar className="h-4 w-4" />
                                                <span className="text-xs font-medium">{user.joined}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="h-10 w-10 rounded-xl hover:bg-surface-container-highest flex items-center justify-center transition-colors text-on-surface-variant">
                                                <MoreHorizontal className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Footer Insight */}
                <div className="flex items-center gap-4 p-6 bg-surface-container-highest/20 rounded-2xl border border-primary/5">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-xs text-on-surface-variant font-medium">
                        Has utilizado <span className="text-on-surface font-black">4 de 10</span> licencias disponibles. 
                        <Link href="/billing" className="text-primary font-bold hover:underline ml-2">Subir de nivel</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
