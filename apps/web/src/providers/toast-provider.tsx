"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertCircle, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "loading";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => string;
    dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within a ToastProvider");
    return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = useCallback((message: string, type: ToastType = "info") => {
        const id = Math.random().toString(36).slice(2);
        setToasts((prev) => [...prev, { id, message, type }]);

        if (type !== "loading") {
            setTimeout(() => dismiss(id), 4000);
        }
        return id;
    }, [dismiss]);

    return (
        <ToastContext.Provider value={{ toast, dismiss }}>
            {children}
            <div className="fixed bottom-6 right-6 z-100 flex flex-col gap-3 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((t) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className={cn(
                                "pointer-events-auto flex items-center gap-3 overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-xl min-w-[280px] max-w-sm",
                                t.type === "success" && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                                t.type === "error" && "bg-red-500/10 border-red-500/20 text-red-400",
                                t.type === "info" && "bg-zinc-900/80 border-white/5 text-zinc-300",
                                t.type === "loading" && "bg-blue-500/10 border-blue-500/20 text-blue-400"
                            )}
                        >
                            <div className="shrink-0">
                                {t.type === "success" && <CheckCircle2 className="h-5 w-5" />}
                                {t.type === "error" && <AlertCircle className="h-5 w-5" />}
                                {t.type === "info" && <Info className="h-5 w-5" />}
                                {t.type === "loading" && <Spinner size="sm" />}
                            </div>
                            <p className="flex-1 text-sm font-bold tracking-tight">{t.message}</p>
                            <button
                                onClick={() => dismiss(t.id)}
                                className="shrink-0 rounded-lg p-1 hover:bg-white/5 transition-colors"
                            >
                                <X className="h-4 w-4 opacity-50" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}
