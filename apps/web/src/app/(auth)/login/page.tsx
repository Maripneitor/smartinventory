"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Package2, Mail, Loader2, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL ?? window.location.origin}/callback`,
            },
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage("¡Código enviado! Revisa tu bandeja de entrada.");
        }
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-white">
            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
            </div>

            <div className="z-10 w-full max-w-md flex flex-col gap-8">
                {/* Logo */}
                <div className="flex flex-col items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-xl shadow-blue-500/20">
                        <Package2 className="h-10 w-10 text-white" />
                    </div>
                    <div className="text-center">
                        <h1 className="font-display text-3xl font-bold tracking-tight">SmartInventory</h1>
                        <p className="text-sm text-zinc-500">Tu inventario asistido por IA</p>
                    </div>
                </div>

                {/* Login Card */}
                <div className="glass-card flex flex-col gap-6 p-8">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-xl font-bold">Bienvenido</h2>
                        <p className="text-sm text-zinc-400">Ingresa tu email para recibir un acceso mágico.</p>
                    </div>

                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                            <input
                                type="email"
                                placeholder="tu@email.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-2xl border border-white/5 bg-zinc-900 py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-bold text-white transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Enviar Acceso <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {message && (
                        <div className="flex items-center gap-3 rounded-xl bg-blue-500/10 p-4 text-sm text-blue-400 border border-blue-500/20">
                            <ShieldCheck className="h-5 w-5 flex-shrink-0" />
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20 text-center">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer info */}
                <p className="px-8 text-center text-xs text-zinc-600 leading-relaxed">
                    Al ingresar, aceptas que SmartInventory use IA para analizar las fotos de tus pertenencias.
                </p>
            </div>
        </div>
    );
}
