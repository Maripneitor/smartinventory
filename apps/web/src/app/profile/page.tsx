"use client";

import { useState, useEffect } from "react";
import { createClient, getDevUser } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Mail, Shield, Camera, ChevronLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

import { type User as SupabaseUser } from "@supabase/supabase-js";

export default function EditProfile() {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    useEffect(() => {
        async function loadProfile() {
            const userData = await getDevUser();
            if (userData) {
                setUser(userData);
                setName(userData.user_metadata?.full_name || userData.email?.split("@")[0] || "");
                setEmail(userData.email || "");
            }
            setLoading(false);
        }
        loadProfile();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const toastId = toast.loading("Actualizando perfil...");
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.updateUser({
                data: { full_name: name }
            });

            if (error) throw error;
            toast.success("Perfil actualizado con éxito", { id: toastId });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Error al actualizar perfil";
            toast.error(message, { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 space-y-12">
            {/* Header Editorial */}
            <div className="flex flex-col gap-4">
                <Link 
                    href="/" 
                    className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-xs font-black uppercase tracking-widest"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Volver al Dashboard
                </Link>
                <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl md:text-6xl font-headline font-bold text-on-surface tracking-tighter"
                >
                    Perfil de <span className="text-primary italic">Usuario</span>
                </motion.h1>
                <p className="text-on-surface-variant font-body text-lg max-w-2xl leading-relaxed">
                    Gestiona tu identidad digital y preferencias de acceso dentro del ecosistema de SmartInventory AI.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Avatar Section */}
                <Card className="p-8 flex flex-col items-center justify-center gap-6 bg-surface-container-low border-none cloud-shadow rounded-[2rem]">
                    <div className="relative group">
                        <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-surface shadow-inner overflow-hidden">
                            {user?.user_metadata?.avatar_url ? (
                                <img src={user.user_metadata.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-16 w-16 text-primary/40" />
                            )}
                        </div>
                        <button className="absolute bottom-0 right-0 p-3 bg-primary text-on-primary rounded-full shadow-lg hover:scale-110 transition-transform">
                            <Camera className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="text-center">
                        <h3 className="font-headline font-bold text-on-surface text-xl">{name}</h3>
                        <p className="text-xs font-black text-primary uppercase tracking-widest mt-1">Colaborador Principal</p>
                    </div>
                </Card>

                {/* Info Form */}
                <div className="md:col-span-2 space-y-8">
                    <Card className="p-10 bg-surface-container-lowest border-none cloud-shadow rounded-[3rem] space-y-8">
                        <div className="grid grid-cols-1 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant ml-1 flex items-center gap-2">
                                    <User className="h-3 w-3" />
                                    Nombre Completo
                                </label>
                                <Input 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Tu nombre real"
                                    className="h-14 rounded-2xl bg-surface-container-low border-none font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant ml-1 flex items-center gap-2">
                                    <Mail className="h-3 w-3" />
                                    Correo Electrónico
                                </label>
                                <Input 
                                    value={email} 
                                    disabled
                                    className="h-14 rounded-2xl bg-surface-container-low/50 border-none font-bold text-on-surface-variant cursor-not-allowed opacity-60"
                                />
                                <p className="text-[10px] text-on-surface-variant/60 italic ml-1">El correo electrónico está vinculado a tu cuenta de Supabase.</p>
                            </div>

                            <div className="pt-4 border-t border-outline-variant/10 flex items-center justify-between">
                                <div className="flex items-center gap-3 text-on-surface-variant">
                                    <div className="h-10 w-10 rounded-xl bg-surface-container flex items-center justify-center">
                                        <Shield className="h-5 w-5 text-secondary" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-on-surface">Nivel de Seguridad</p>
                                        <p className="text-[10px] font-medium opacity-60">Autenticación Multifactor Activa</p>
                                    </div>
                                </div>
                                <Button 
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="h-14 px-8 rounded-2xl bg-linear-to-r from-primary to-primary-container text-on-primary font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95"
                                >
                                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                        <>
                                            <Save className="h-5 w-5 mr-2" />
                                            Guardar Cambios
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Danger Zone */}
                    <div className="p-8 rounded-[2rem] bg-error-container/10 border border-error/10 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-error">Sesiones Activas</p>
                            <p className="text-xs text-on-surface-variant font-medium mt-1">Cierra la sesión en todos tus dispositivos actuales.</p>
                        </div>
                        <Button variant="ghost" className="text-error font-black text-[10px] uppercase tracking-widest hover:bg-error/10">
                            Cerrar Sesiones
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
