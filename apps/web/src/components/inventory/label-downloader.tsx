"use client";

import { useState } from "react";
import { FileText, Download, Loader2 } from "lucide-react";
import { generateSingleItemLabel } from "@/core/labels";
import { cn } from "@/lib/utils";

interface LabelDownloaderProps {
    item: {
        name: string;
        category: string | null;
        serial_number: string | null;
    };
    variant?: "button" | "icon";
    size?: "small" | "medium";
}

export function LabelDownloader({ item, variant = "button", size = "medium" }: LabelDownloaderProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setLoading(true);
        setError(null);
        try {
            await generateSingleItemLabel({ item, size });
        } catch (err) {
            console.error("Error generating PDF:", err);
            setError("Error al generar el PDF");
            setTimeout(() => setError(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    if (variant === "icon") {
        return (
            <div className="relative">
                <button
                    onClick={handleDownload}
                    disabled={loading}
                    className={cn(
                        "h-8 w-8 flex items-center justify-center rounded-lg transition-all disabled:opacity-50 shadow-sm backdrop-blur-md",
                        error ? "bg-red-500 text-white" : "bg-white/90 hover:bg-sky-600 hover:text-white text-sky-600"
                    )}
                    title={error || "Descargar Etiqueta PDF"}
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                </button>
                {error && (
                    <div className="absolute bottom-full mb-2 right-0 bg-error text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-1">
                        {error}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={handleDownload}
                disabled={loading}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl font-body text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 shadow-sm",
                    error ? "bg-error/10 text-error" : "bg-surface-container-highest text-on-surface hover:bg-surface-container"
                )}
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                    <Download className={cn("h-4 w-4", error ? "text-error" : "text-primary")} />
                )}
                {error ? "Reintentar" : `Etiqueta ${size === 'small' ? 'Pq' : 'Md'}`}
            </button>
        </div>
    );
}
