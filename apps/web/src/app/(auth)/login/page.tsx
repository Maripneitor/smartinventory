"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Package2, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

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
        <div className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-white overflow-hidden relative">
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="z-10 w-full max-w-sm flex flex-col gap-10">
                {/* Logo */}
                <div className="flex flex-col items-center gap-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-blue-600 shadow-2xl shadow-blue-500/40">
                        <Package2 className="h-10 w-10 text-white" />
                    </div>
                    <div className="text-center flex flex-col gap-2">
                        <h1 className="font-display text-4xl font-black tracking-tight text-white">SmartInventory</h1>
                        <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">Inteligencia Artificial • Offline First</p>
                    </div>
                </div>

                {/* Login Card */}
                <Card variant="glass" className="flex flex-col gap-8 p-10 rounded-[3rem]">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-2xl font-black text-white">Bienvenido</h2>
                        <p className="text-sm font-medium text-zinc-400 leading-relaxed">Ingresa tu email para recibir un acceso mágico y seguro.</p>
                    </div>

                    <form onSubmit={handleLogin} className="flex flex-col gap-5">
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                type="email"
                                placeholder="tu@email.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-12 h-14 rounded-2xl border-white/5 bg-zinc-950/50"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="h-14 rounded-2xl text-lg font-black tracking-tight"
                        >
                            {loading ? (
                                <Spinner size="sm" />
                            ) : (
                                <>
                                    Enviar Acceso <ArrowRight className="h-5 w-5 ml-2" />
                                </>
                            )}
                        </Button>
                    </form>

                    {message && (
                        <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 p-5 text-sm font-bold text-emerald-400 border border-emerald-500/20 animate-in fade-in slide-in-from-top-2">
                            <ShieldCheck className="h-5 w-5 flex-shrink-0" />
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="rounded-2xl bg-red-500/10 p-5 text-sm font-bold text-red-400 border border-red-500/20 text-center animate-in shake duration-500">
                            {error}
                        </div>
                    )}
                </Card>

                {/* Footer info info */}
                <p className="px-8 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-700 leading-wider">
                    Análisis por IA • Encriptación de Extremo a Extremo
                </p>
            </div>
        </div>
    );
}
